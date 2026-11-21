import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "./realtime.gateway";
import { RedisService } from "./redis.service";

const QUEUE_PREFIX = "queue:";
const SLOT_MS = 30 * 60 * 1000;

export interface QueueMetricsInput {
  skill: string;
  channel: string;
  waiting: number;
  activeContacts: number;
  longestWaitSec: number;
}

interface LiveRow {
  skill: string;
  channel: string;
  forecastCalls: number;
  required: number;
  scheduled: number;
  onFloor: number;
  waiting: number;
  activeContacts: number;
  longestWaitSec: number;
}

@Injectable()
export class RealtimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async updateQueueMetrics(input: QueueMetricsInput) {
    const key = `${QUEUE_PREFIX}${input.skill}:${input.channel}`;
    await this.redis.setHash(key, {
      skill: input.skill,
      channel: input.channel,
      waiting: input.waiting,
      activeContacts: input.activeContacts,
      longestWaitSec: input.longestWaitSec,
      updatedAt: new Date().toISOString(),
    });
    await this.broadcastStaffing();
    return { success: true, store: this.redis.usingRedis ? "redis" : "memory" };
  }

  async getQueueMetrics() {
    const hashes = await this.redis.getHashes(QUEUE_PREFIX);
    return Object.values(hashes).map((h) => ({
      skill: h.skill,
      channel: h.channel,
      waiting: Number(h.waiting),
      activeContacts: Number(h.activeContacts),
      longestWaitSec: Number(h.longestWaitSec),
      updatedAt: h.updatedAt,
    }));
  }

  /**
   * Live staffing picture for the current 30-minute interval:
   * required (forecast) vs scheduled vs actually on the floor, per skill+channel.
   */
  async getLiveStaffing(now = new Date()) {
    const slotStart = new Date(Math.floor(now.getTime() / SLOT_MS) * SLOT_MS);

    const [forecasts, schedules, queues] = await Promise.all([
      this.prisma.forecast.findMany({
        where: { intervalStart: slotStart },
        include: { skill: true },
      }),
      this.prisma.agentSchedule.findMany({
        where: { intervalStart: slotStart },
        include: { agent: true, skill: true },
      }),
      this.getQueueMetrics(),
    ]);

    const rows = new Map<string, LiveRow>();
    const rowFor = (skill: string, channel: string) => {
      const key = `${skill}|${channel}`;
      if (!rows.has(key)) {
        rows.set(key, {
          skill,
          channel,
          forecastCalls: 0,
          required: 0,
          scheduled: 0,
          onFloor: 0,
          waiting: 0,
          activeContacts: 0,
          longestWaitSec: 0,
        });
      }
      return rows.get(key)!;
    };

    for (const f of forecasts) {
      const r = rowFor(f.skill.name, f.channel);
      r.forecastCalls += f.forecastCalls;
      r.required += f.requiredAgents ?? 0;
    }

    for (const s of schedules) {
      const r = rowFor(s.skill.name, s.channel);
      r.scheduled += 1;
      if (["Available", "OnCall"].includes(s.agent.status)) r.onFloor += 1;
    }

    for (const q of queues) {
      const r = rowFor(q.skill, q.channel);
      r.waiting = q.waiting;
      r.activeContacts = q.activeContacts;
      r.longestWaitSec = q.longestWaitSec;
    }

    const items = [...rows.values()]
      .map((r) => ({ ...r, gap: r.onFloor - r.required }))
      .sort(
        (a, b) =>
          a.skill.localeCompare(b.skill) || a.channel.localeCompare(b.channel),
      );

    return {
      intervalStart: slotStart,
      generatedAt: now,
      store: this.redis.usingRedis ? "redis" : "memory",
      items,
    };
  }

  /** Pushes a fresh live-staffing snapshot to every connected dashboard. */
  async broadcastStaffing() {
    this.gateway.emit("staffing:update", await this.getLiveStaffing());
  }
}
