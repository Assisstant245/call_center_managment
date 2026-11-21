import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { ForecastClient } from "../common/forecast-client";
import { RealtimeService } from "../realtime/realtime.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AssignedRow, buildAssignmentNotices } from "./assignment-notice";
import {
  DAY_MS,
  DemandSlot,
  SLOT_MS,
  ScheduleResult,
  SchedulableAgent,
  greedySchedule,
  shiftWindow,
  slotStartsInWindows,
  utcMidnight,
} from "./scheduler";

@Injectable()
export class AgentScheduleService {
  private readonly logger = new Logger(AgentScheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastClient: ForecastClient,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Tells every affected agent (who has a login) what they were assigned. */
  private async notifyAssigned(rows: AssignedRow[]) {
    if (rows.length === 0) return;

    const agentIds = [...new Set(rows.map((r) => r.agentId))];
    const [agents, skills] = await Promise.all([
      this.prisma.agent.findMany({
        where: { id: { in: agentIds }, userId: { not: null } },
        select: { id: true, userId: true },
      }),
      this.prisma.skill.findMany({ select: { id: true, name: true } }),
    ]);
    if (agents.length === 0) return;

    const notices = buildAssignmentNotices(
      rows.filter((r) => agents.some((a) => a.id === r.agentId)),
      new Map(skills.map((s) => [s.id, s.name])),
    );

    for (const agent of agents) {
      const notice = notices.get(agent.id);
      if (notice && agent.userId) {
        await this.notifications.notify({
          userId: agent.userId,
          title: notice.title,
          message: notice.message,
          type: "info",
        });
      }
    }
  }

  // ============================================
  // MANUAL CREATE
  // ============================================

  async create(data: {
    agentId: number;
    skillId: number;
    channel: string;
    intervalStart: Date;
    intervalEnd: Date;
  }) {
    if (data.intervalEnd <= data.intervalStart) {
      throw new BadRequestException("intervalEnd must be after intervalStart");
    }

    const [agent, skill] = await Promise.all([
      this.prisma.agent.findUnique({
        where: { id: data.agentId },
        include: { agentSkills: true },
      }),
      this.prisma.skill.findUnique({ where: { id: data.skillId } }),
    ]);

    if (!agent) throw new NotFoundException(`Agent ${data.agentId} not found`);
    if (!skill) throw new NotFoundException(`Skill ${data.skillId} not found`);
    if (!agent.agentSkills.some((s) => s.skillId === data.skillId)) {
      throw new BadRequestException(`${agent.name} does not have skill "${skill.name}"`);
    }

    const overlap = await this.prisma.agentSchedule.findFirst({
      where: {
        agentId: data.agentId,
        intervalStart: { lt: data.intervalEnd },
        intervalEnd: { gt: data.intervalStart },
      },
    });
    if (overlap) {
      throw new BadRequestException("Agent is already scheduled in that time range");
    }

    const created = await this.prisma.agentSchedule.create({
      data: { ...data, status: "Scheduled" },
      include: { agent: true, skill: true },
    });
    void this.realtime.broadcastStaffing();
    void this.notifyAssigned([created]);
    return created;
  }

  // ============================================
  // AUTOMATIC SCHEDULING - ONE INTERVAL
  // ============================================

  async generateSchedule(data: {
    intervalStart: Date;
    skill: string;
    channel: string;
    requiredAgents: number;
  }) {
    const skill = await this.findSkill(data.skill);

    const start = data.intervalStart.getTime();
    const slot: DemandSlot = {
      id: `${skill.id}|${data.channel}|${start}`,
      skillId: skill.id,
      channel: data.channel,
      start,
      required: data.requiredAgents,
    };

    const outcome = await this.runScheduling([slot], new Date(start));

    return {
      success: outcome.created > 0 && outcome.result.shortfalls.length === 0,
      skill: skill.name,
      skillId: skill.id,
      channel: data.channel,
      intervalStart: data.intervalStart,
      intervalEnd: new Date(start + SLOT_MS),
      requiredAgents: data.requiredAgents,
      scheduledAgents: outcome.created,
      availableAgents: outcome.eligibleAgents,
      message:
        outcome.result.shortfalls.length > 0
          ? `Only ${outcome.created} of ${data.requiredAgents} required agents could be scheduled`
          : "Schedule generated",
      engine: outcome.result.engine,
    };
  }

  // ============================================
  // AUTOMATIC SCHEDULING - WHOLE DAY FROM FORECAST
  // ============================================

  async generateDay(data: {
    date: Date;
    skill?: string;
    channel?: string;
    replaceExisting?: boolean;
  }) {
    const dayStart = utcMidnight(data.date);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const skill = data.skill ? await this.findSkill(data.skill) : null;

    const scope = {
      intervalStart: { gte: dayStart, lt: dayEnd },
      ...(skill && { skillId: skill.id }),
      ...(data.channel && { channel: data.channel }),
    };

    if (data.replaceExisting) {
      await this.prisma.agentSchedule.deleteMany({
        where: { ...scope, status: "Scheduled" },
      });
    }

    const forecasts = await this.prisma.forecast.findMany({ where: scope });
    if (forecasts.length === 0) {
      throw new NotFoundException(
        "No forecast found for that day. Generate a forecast first.",
      );
    }

    const existing = await this.prisma.agentSchedule.groupBy({
      by: ["skillId", "channel", "intervalStart"],
      where: scope,
      _count: { _all: true },
    });
    const existingCount = new Map(
      existing.map((e) => [
        `${e.skillId}|${e.channel}|${e.intervalStart.getTime()}`,
        e._count._all,
      ]),
    );

    const slotMap = new Map<string, DemandSlot>();
    for (const f of forecasts) {
      const start = f.intervalStart.getTime();
      const id = `${f.skillId}|${f.channel}|${start}`;
      const slot = slotMap.get(id);
      const required = f.requiredAgents ?? 0;
      if (slot) {
        slot.required += required;
      } else {
        slotMap.set(id, {
          id,
          skillId: f.skillId,
          channel: f.channel,
          start,
          required,
          forecastId: f.id,
        });
      }
    }

    const slots = [...slotMap.values()]
      .map((s) => ({ ...s, required: Math.max(0, s.required - (existingCount.get(s.id) ?? 0)) }))
      .filter((s) => s.required > 0);

    if (slots.length === 0) {
      return {
        success: true,
        message: "Forecast is already fully scheduled",
        scheduledAssignments: 0,
        coverage: 1,
        shortfalls: [],
      };
    }

    const outcome = await this.runScheduling(slots, dayStart);

    return {
      success: true,
      date: dayStart.toISOString().slice(0, 10),
      engine: outcome.result.engine,
      status: outcome.result.status,
      slots: slots.length,
      scheduledAssignments: outcome.created,
      coverage: outcome.result.coverage,
      shortfalls: outcome.result.shortfalls.map((s) => {
        const slot = slotMap.get(s.slotId)!;
        return {
          intervalStart: new Date(slot.start),
          skillId: slot.skillId,
          channel: slot.channel,
          missing: s.missing,
        };
      }),
    };
  }

  // ============================================
  // CORE: load agents, solve, persist
  // ============================================

  private async runScheduling(slots: DemandSlot[], anchor: Date) {
    const from = utcMidnight(anchor).getTime();
    const starts = slots.map((s) => s.start);
    const minStart = Math.min(...starts);
    const maxStart = Math.max(...starts);
    const firstDay = utcMidnight(new Date(minStart));
    const lastDay = utcMidnight(new Date(maxStart));

    // Shifts of the day before are loaded too: night shifts run past midnight.
    const workDateFrom = new Date(firstDay.getTime() - DAY_MS);

    const [agents, timeOff, booked] = await Promise.all([
      this.prisma.agent.findMany({
        include: {
          agentSkills: true,
          agentShifts: {
            where: { workDate: { gte: workDateFrom, lte: lastDay } },
            include: { shift: true },
          },
        },
      }),
      this.prisma.timeOffRequest.findMany({
        where: {
          status: "Approved",
          startDate: { lte: lastDay },
          endDate: { gte: workDateFrom },
        },
      }),
      this.prisma.agentSchedule.findMany({
        where: { intervalStart: { gte: new Date(minStart), lte: new Date(maxStart) } },
        select: { agentId: true, intervalStart: true },
      }),
    ]);

    const bookedByAgent = new Map<number, number[]>();
    for (const b of booked) {
      const list = bookedByAgent.get(b.agentId) ?? [];
      list.push(b.intervalStart.getTime());
      bookedByAgent.set(b.agentId, list);
    }

    const rangeFrom = Math.min(from, minStart);
    const rangeTo = maxStart + SLOT_MS;

    const schedulable: SchedulableAgent[] = agents
      .filter((a) => a.status !== "Inactive")
      .map((agent) => {
        const windows = agent.agentShifts
          .filter(
            (as) =>
              as.shift.status === "Active" &&
              !timeOff.some(
                (t) =>
                  t.agentId === agent.id &&
                  t.startDate <= as.workDate &&
                  t.endDate >= as.workDate,
              ),
          )
          .map((as) => shiftWindow(as.workDate, as.shift.startTime, as.shift.endTime));

        return {
          id: agent.id,
          skillIds: agent.agentSkills.map((s) => s.skillId),
          availableStarts: slotStartsInWindows(windows, rangeFrom, rangeTo),
          busyStarts: bookedByAgent.get(agent.id) ?? [],
        };
      });

    const result = await this.solve(slots, schedulable);

    const slotById = new Map(slots.map((s) => [s.id, s]));
    const rows = result.assignments.map((a) => {
      const slot = slotById.get(a.slotId)!;
      return {
        agentId: a.agentId,
        skillId: slot.skillId,
        forecastId: slot.forecastId ?? null,
        channel: slot.channel,
        intervalStart: new Date(slot.start),
        intervalEnd: new Date(slot.start + SLOT_MS),
        status: "Scheduled",
      };
    });

    if (rows.length > 0) {
      await this.prisma.agentSchedule.createMany({ data: rows });
      void this.realtime.broadcastStaffing();
      void this.notifyAssigned(rows);
    }

    const eligibleAgents = schedulable.filter((a) =>
      slots.some(
        (s) => a.skillIds.includes(s.skillId) && a.availableStarts.includes(s.start),
      ),
    ).length;

    return { result, created: rows.length, eligibleAgents };
  }

  /**
   * Runs the greedy heuristic and the OR-Tools optimiser (Python service) and
   * keeps whichever covers more demand. Greedy is also the fallback when the
   * optimiser is unavailable.
   */
  private async solve(
    slots: DemandSlot[],
    agents: SchedulableAgent[],
  ): Promise<ScheduleResult> {
    const greedy = greedySchedule(slots, agents);
    if (process.env.SCHEDULER_ENGINE === "greedy" || greedy.coverage >= 1) {
      return greedy;
    }

    try {
      const response = await this.forecastClient.post<
        Omit<ScheduleResult, "engine">
      >(
        "/schedule/optimize",
        {
          slots: slots.map((s) => ({
            id: s.id,
            skillId: s.skillId,
            start: s.start,
            required: s.required,
          })),
          agents,
          timeLimitSec: 20,
        },
        60_000,
      );

      if (response.status !== "infeasible" && response.coverage >= greedy.coverage) {
        return { ...response, engine: "optimizer" };
      }
    } catch (err) {
      this.logger.warn(
        `Optimiser unavailable, using greedy result: ${(err as Error).message}`,
      );
    }

    return greedy;
  }

  // ============================================
  // READ / DELETE
  // ============================================

  async findAll(filter: {
    date?: string;
    skill?: string;
    channel?: string;
    agentId?: number;
  }) {
    const dayStart = filter.date ? utcMidnight(new Date(filter.date)) : null;

    return this.prisma.agentSchedule.findMany({
      where: {
        ...(filter.agentId && { agentId: filter.agentId }),
        ...(filter.channel && { channel: filter.channel }),
        ...(filter.skill && {
          skill: { name: { equals: filter.skill, mode: "insensitive" } },
        }),
        ...(dayStart && {
          intervalStart: {
            gte: dayStart,
            lt: new Date(dayStart.getTime() + DAY_MS),
          },
        }),
      },
      include: { agent: true, skill: true },
      orderBy: [{ intervalStart: "asc" }, { agentId: "asc" }],
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.agentSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Schedule entry not found");
    await this.prisma.agentSchedule.delete({ where: { id } });
    void this.realtime.broadcastStaffing();
    return { success: true };
  }

  private async findSkill(name: string) {
    const skill = await this.prisma.skill.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (!skill) throw new NotFoundException(`Skill "${name}" not found`);
    return skill;
  }
}
