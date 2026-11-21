import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { RealtimeService } from "../realtime/realtime.service";
import { findAgentForUser } from "../common/agent-lookup";
import type { AuthUser } from "../common/security/current-user.decorator";
import { REVIEWER_ROLES } from "../common/security/roles";
import { DAY_MS, utcMidnight } from "../agent-schedule/scheduler";
import { computeAdherence } from "./adherence.calculator";

@Injectable()
export class AdherenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /** Record an agent state change (login, break, call, ...). */
  async recordEvent(
    user: AuthUser,
    input: { agentId?: number; state: string; at?: string },
  ) {
    const isReviewer = REVIEWER_ROLES.includes(user.role as never);

    let agentId: number;
    if (input.agentId && isReviewer) {
      agentId = input.agentId;
    } else {
      const own = await findAgentForUser(this.prisma, user);
      if (!own) throw new ForbiddenException("No agent profile is linked to your account");
      if (input.agentId && input.agentId !== own.id) {
        throw new ForbiddenException("You can only update your own status");
      }
      agentId = own.id;
    }

    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException("Agent not found");

    const occurredAt = input.at ? new Date(input.at) : new Date();

    const [event] = await this.prisma.$transaction([
      this.prisma.adherenceEvent.create({
        data: { agentId, state: input.state, occurredAt },
      }),
      this.prisma.agent.update({ where: { id: agentId }, data: { status: input.state } }),
    ]);

    void this.realtime.broadcastStaffing();
    return event;
  }

  /** Adherence per agent for one day (default: today, measured up to now). */
  async report(filter: { date?: string; agentId?: number }, now = new Date()) {
    const dayStart = filter.date ? utcMidnight(new Date(filter.date)) : utcMidnight(now);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const windowEnd = Math.min(now.getTime(), dayEnd.getTime());

    const agents = await this.prisma.agent.findMany({
      where: filter.agentId ? { id: filter.agentId } : {},
      orderBy: { name: "asc" },
    });

    const [schedules, events, previous] = await Promise.all([
      this.prisma.agentSchedule.findMany({
        where: {
          agentId: { in: agents.map((a) => a.id) },
          intervalStart: { gte: dayStart, lt: dayEnd },
        },
      }),
      this.prisma.adherenceEvent.findMany({
        where: {
          agentId: { in: agents.map((a) => a.id) },
          occurredAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      this.prisma.adherenceEvent.findMany({
        where: {
          agentId: { in: agents.map((a) => a.id) },
          occurredAt: { lt: dayStart },
        },
        orderBy: { occurredAt: "desc" },
        distinct: ["agentId"],
      }),
    ]);

    const lastStateBefore = new Map(previous.map((p) => [p.agentId, p.state]));

    const rows = agents
      .map((agent) => {
        const result = computeAdherence(
          schedules
            .filter((s) => s.agentId === agent.id)
            .map((s) => ({ start: s.intervalStart.getTime(), end: s.intervalEnd.getTime() })),
          events
            .filter((e) => e.agentId === agent.id)
            .map((e) => ({ state: e.state, at: e.occurredAt.getTime() })),
          lastStateBefore.get(agent.id) ?? "Offline",
          dayStart.getTime(),
          windowEnd,
        );

        return {
          agentId: agent.id,
          employeeId: agent.employeeId,
          name: agent.name,
          currentState: agent.status,
          ...result,
          violations: result.violations.map((v) => ({
            start: new Date(v.start),
            end: new Date(v.end),
            state: v.state,
            minutes: Math.round((v.end - v.start) / 60_000),
          })),
        };
      })
      .filter((r) => r.scheduledMinutes > 0 || filter.agentId);

    const scheduled = rows.reduce((s, r) => s + r.scheduledMinutes, 0);
    const adherent = rows.reduce((s, r) => s + r.adherentMinutes, 0);

    return {
      date: dayStart.toISOString().slice(0, 10),
      overallAdherencePct: scheduled ? Number(((adherent / scheduled) * 100).toFixed(1)) : null,
      scheduledMinutes: scheduled,
      adherentMinutes: adherent,
      agents: rows,
    };
  }
}
