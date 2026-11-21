import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { AdherenceService } from "../adherence/adherence.service";
import { findAgentForUser } from "../common/agent-lookup";
import type { AuthUser } from "../common/security/current-user.decorator";
import { DAY_MS, SLOT_MS, utcMidnight } from "../agent-schedule/scheduler";

export interface Block {
  skill: string;
  channel: string;
  start: Date;
  end: Date;
}

/** Joins back-to-back 30-minute slots with the same skill/channel into work blocks. */
export function toBlocks(
  rows: { skill: { name: string }; channel: string; intervalStart: Date; intervalEnd: Date }[],
): Block[] {
  const sorted = [...rows].sort((a, b) => a.intervalStart.getTime() - b.intervalStart.getTime());
  const blocks: Block[] = [];

  for (const r of sorted) {
    const last = blocks[blocks.length - 1];
    if (
      last &&
      last.skill === r.skill.name &&
      last.channel === r.channel &&
      last.end.getTime() === r.intervalStart.getTime()
    ) {
      last.end = r.intervalEnd;
    } else {
      blocks.push({
        skill: r.skill.name,
        channel: r.channel,
        start: r.intervalStart,
        end: r.intervalEnd,
      });
    }
  }
  return blocks;
}

@Injectable()
export class MyDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adherence: AdherenceService,
  ) {}

  async get(user: AuthUser, now = new Date()) {
    const agent = await findAgentForUser(this.prisma, user);
    if (!agent) {
      throw new NotFoundException(
        "No agent profile is linked to your account. Ask a manager to create one with your e-mail address.",
      );
    }

    const today = utcMidnight(now);
    const tomorrow = new Date(today.getTime() + DAY_MS);
    const weekEnd = new Date(today.getTime() + 8 * DAY_MS);
    const slotNow = new Date(Math.floor(now.getTime() / SLOT_MS) * SLOT_MS);

    const [skills, shifts, todaySchedule, tomorrowSchedule, upcomingSchedule, timeOff, swaps, unread] =
      await Promise.all([
        this.prisma.agentSkill.findMany({
          where: { agentId: agent.id },
          include: { skill: true },
        }),
        this.prisma.agentShift.findMany({
          where: { agentId: agent.id, workDate: { gte: today, lt: weekEnd } },
          include: { shift: true },
          orderBy: { workDate: "asc" },
        }),
        this.prisma.agentSchedule.findMany({
          where: { agentId: agent.id, intervalStart: { gte: today, lt: tomorrow } },
          include: { skill: true },
        }),
        this.prisma.agentSchedule.findMany({
          where: {
            agentId: agent.id,
            intervalStart: { gte: tomorrow, lt: new Date(tomorrow.getTime() + DAY_MS) },
          },
          include: { skill: true },
        }),
        this.prisma.agentSchedule.count({
          where: { agentId: agent.id, intervalStart: { gte: tomorrow, lt: weekEnd } },
        }),
        this.prisma.timeOffRequest.findMany({
          where: {
            agentId: agent.id,
            OR: [{ status: "Pending" }, { status: "Approved", endDate: { gte: today } }],
          },
          orderBy: { startDate: "asc" },
          take: 5,
        }),
        this.prisma.shiftSwapRequest.findMany({
          where: {
            status: { in: ["Pending", "Accepted"] },
            OR: [{ requesterId: agent.id }, { targetId: agent.id }],
          },
          include: {
            requester: { select: { id: true, name: true } },
            target: { select: { id: true, name: true } },
            requesterShift: { include: { shift: true } },
            targetShift: { include: { shift: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.notification.count({ where: { userId: user.sub, readAt: null } }),
      ]);

    const blocks = toBlocks(todaySchedule);
    const current = todaySchedule.find((s) => s.intervalStart.getTime() === slotNow.getTime());
    const next = blocks.find((b) => b.start > now);

    const adherenceReport = await this.adherence.report(
      { date: today.toISOString().slice(0, 10), agentId: agent.id },
      now,
    );
    const mine = adherenceReport.agents[0];

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        employeeId: agent.employeeId,
        status: agent.status,
        skills: skills.map((s) => s.skill.name),
      },
      now: now.toISOString(),
      todayShift: shifts.find((s) => s.workDate.getTime() === today.getTime())?.shift ?? null,
      currentAssignment: current
        ? {
            skill: current.skill.name,
            channel: current.channel,
            start: current.intervalStart,
            end: current.intervalEnd,
          }
        : null,
      nextBlock: next ?? null,
      todayBlocks: blocks,
      todayScheduledMinutes: todaySchedule.length * 30,
      tomorrowBlocks: toBlocks(tomorrowSchedule),
      upcomingShifts: shifts
        .filter((s) => s.workDate.getTime() > today.getTime())
        .map((s) => ({ id: s.id, workDate: s.workDate, shift: s.shift })),
      upcomingScheduledIntervals: upcomingSchedule,
      adherence: mine
        ? {
            pct: mine.adherencePct,
            scheduledMinutes: mine.scheduledMinutes,
            adherentMinutes: mine.adherentMinutes,
            violations: mine.violations,
          }
        : null,
      requests: { timeOff, swaps },
      unreadNotifications: unread,
    };
  }
}
