import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

const DAY_MS = 24 * 60 * 60 * 1000;

interface IntervalRow {
  intervalStart: Date;
  intervalEnd: Date;
  forecastCalls: number;
  requiredAgents: number;
  scheduledAgents: number;
  availableAgents: number;
  skill: string;
  skillId: number;
  channel: string;
}

const formatTime = (date: Date) =>
  date.toISOString().slice(11, 16); // HH:MM (UTC)

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(skillName?: string, date?: string, channel?: string) {
    // 1. Selected skill
    let skillId: number | undefined;
    if (skillName) {
      const skill = await this.prisma.skill.findFirst({
        where: { name: { equals: skillName, mode: "insensitive" } },
      });
      if (!skill) throw new NotFoundException(`Skill "${skillName}" not found`);
      skillId = skill.id;
    }

    const dayStart = date ? new Date(`${date}T00:00:00.000Z`) : undefined;
    const where = {
      ...(skillId !== undefined && { skillId }),
      ...(channel && { channel }),
      ...(dayStart && {
        intervalStart: { gte: dayStart, lt: new Date(dayStart.getTime() + DAY_MS) },
      }),
    };

    // 2. Forecasts, schedules, agent-skill matrix
    const [forecasts, schedules, agentSkills] = await Promise.all([
      this.prisma.forecast.findMany({
        where,
        include: { skill: true },
        orderBy: { intervalStart: "asc" },
      }),
      this.prisma.agentSchedule.findMany({ where }),
      this.prisma.agentSkill.findMany({ select: { agentId: true, skillId: true } }),
    ]);

    // Distinct agents per skill
    const agentsBySkill = new Map<number, Set<number>>();
    for (const { agentId, skillId: sid } of agentSkills) {
      if (!agentsBySkill.has(sid)) agentsBySkill.set(sid, new Set());
      agentsBySkill.get(sid)!.add(agentId);
    }

    // Scheduled agents per interval + skill + channel
    const scheduledCount = new Map<string, number>();
    for (const s of schedules) {
      const key = `${s.intervalStart.getTime()}|${s.skillId}|${s.channel}`;
      scheduledCount.set(key, (scheduledCount.get(key) ?? 0) + 1);
    }

    // 3. Group forecasts by interval + skill + channel
    const intervalMap = new Map<string, IntervalRow>();
    for (const f of forecasts) {
      const key = `${f.intervalStart.getTime()}|${f.skillId}|${f.channel}`;
      const existing = intervalMap.get(key);

      if (existing) {
        existing.forecastCalls += f.forecastCalls;
        existing.requiredAgents += f.requiredAgents ?? 0;
      } else {
        intervalMap.set(key, {
          intervalStart: f.intervalStart,
          intervalEnd: f.intervalEnd,
          forecastCalls: f.forecastCalls,
          requiredAgents: f.requiredAgents ?? 0,
          scheduledAgents: scheduledCount.get(key) ?? 0,
          availableAgents: agentsBySkill.get(f.skillId)?.size ?? 0,
          skill: f.skill.name,
          skillId: f.skillId,
          channel: f.channel,
        });
      }
    }

    const intervals = [...intervalMap.values()].map((item) => ({
      intervalStart: item.intervalStart,
      intervalEnd: item.intervalEnd,
      time: `${formatTime(item.intervalStart)} - ${formatTime(item.intervalEnd)}`,
      forecastCalls: item.forecastCalls,
      requiredAgents: item.requiredAgents,
      availableAgents: item.availableAgents,
      scheduledAgents: item.scheduledAgents,
      gap: item.scheduledAgents - item.requiredAgents,
      skill: item.skill,
      channel: item.channel,
    }));

    // 4. Summary
    const understaffed = intervals.filter((i) => i.gap < 0).length;

    return {
      filters: {
        skill: skillName ?? "All",
        date: date ?? "All",
        channel: channel ?? "All",
      },
      summary: {
        forecastCalls: intervals.reduce((t, i) => t + i.forecastCalls, 0),
        requiredAgents: Math.max(0, ...intervals.map((i) => i.requiredAgents)),
        availableAgents: Math.max(0, ...intervals.map((i) => i.availableAgents)),
        scheduledAgents: Math.max(0, ...intervals.map((i) => i.scheduledAgents)),
        understaffedIntervals: understaffed,
        totalIntervals: intervals.length,
      },
      intervals,
    };
  }
}
