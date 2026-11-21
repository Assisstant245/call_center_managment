import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { ForecastClient } from "../common/forecast-client";
import { CHANNELS, CreateForecastDto, GenerateForecastDto } from "./dto/create-forecast.dto";
import { DAY_MS, utcMidnight } from "../agent-schedule/scheduler";

interface ForecastRow {
  intervalStart: string;
  intervalEnd: string;
  forecastCalls: number;
  forecastLower: number;
  forecastUpper: number;
  requiredAgents: number;
}

interface ForecastResponse {
  channel: string;
  ahtSec: number;
  accuracy: { mae: number | null; mape: number | null } | null;
  rows: ForecastRow[];
}

const CONCURRENCY = 3;

@Injectable()
export class ForecastService {
  private readonly logger = new Logger(ForecastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: ForecastClient,
  ) {}

  // ============================================
  // MANUAL CREATE
  // ============================================

  async create(data: CreateForecastDto) {
    const skill = await this.prisma.skill.findFirst({
      where: { name: { equals: data.skill, mode: "insensitive" } },
    });
    if (!skill) throw new NotFoundException(`Skill "${data.skill}" not found`);

    return this.prisma.forecast.create({
      data: {
        skillId: skill.id,
        channel: data.channel,
        intervalStart: new Date(data.intervalStart),
        intervalEnd: new Date(data.intervalEnd),
        forecastCalls: Math.round(data.forecastCalls),
        forecastLower: data.forecastLower != null ? Math.round(data.forecastLower) : null,
        forecastUpper: data.forecastUpper != null ? Math.round(data.forecastUpper) : null,
        requiredAgents: data.requiredAgents,
      },
      include: { skill: true },
    });
  }

  // ============================================
  // AI FORECAST (Prophet + Erlang C via Python service)
  // ============================================

  async generate(dto: GenerateForecastDto & { withAccuracy?: boolean }) {
    if (!(await this.client.isUp())) {
      throw new ServiceUnavailableException(
        "Forecasting service is not running. Start it with: uvicorn app:app --port 8000",
      );
    }

    const skills = await this.prisma.skill.findMany({
      where: {
        status: "Active",
        ...(dto.skill && { name: { equals: dto.skill, mode: "insensitive" } }),
      },
    });
    if (skills.length === 0) throw new NotFoundException("No matching active skill");

    const channels = dto.channel ? [dto.channel] : [...CHANNELS];
    const jobs = skills.flatMap((skill) => channels.map((channel) => ({ skill, channel })));

    const results: {
      skill: string;
      channel: string;
      rows: number;
      accuracy: ForecastResponse["accuracy"];
      error?: string;
    }[] = [];

    let cursor = 0;
    const worker = async () => {
      while (cursor < jobs.length) {
        const job = jobs[cursor++];
        results.push(await this.forecastOne(job.skill, job.channel, dto));
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const generated = results.reduce((sum, r) => sum + r.rows, 0);
    if (generated === 0) {
      const reason = results.find((r) => r.error)?.error ?? "no data";
      throw new BadRequestException(
        `Could not generate any forecast (${reason}). Import call history first.`,
      );
    }

    return {
      success: true,
      generatedRows: generated,
      series: results.sort(
        (a, b) => a.skill.localeCompare(b.skill) || a.channel.localeCompare(b.channel),
      ),
    };
  }

  private async forecastOne(
    skill: { id: number; name: string },
    channel: string,
    dto: GenerateForecastDto & { withAccuracy?: boolean },
  ) {
    const base = { skill: skill.name, channel };

    try {
      const history = await this.prisma.callHistory.findMany({
        where: { skillId: skill.id, channel },
        orderBy: { intervalStart: "asc" },
        select: { intervalStart: true, callsOffered: true, avgHandleSec: true },
      });

      if (history.length === 0) {
        return { ...base, rows: 0, accuracy: null, error: "no call history" };
      }

      const start = dto.startDate
        ? utcMidnight(new Date(dto.startDate))
        : new Date(utcMidnight(new Date()).getTime() + DAY_MS);

      const response = await this.client.post<ForecastResponse>("/forecast", {
        channel,
        start: start.toISOString(),
        intervals: dto.intervals ?? 29,
        withAccuracy: dto.withAccuracy === true,
        history: history.map((h) => ({
          ds: h.intervalStart.toISOString(),
          y: h.callsOffered,
          aht: h.avgHandleSec,
        })),
      });

      if (response.rows.length === 0) {
        return { ...base, rows: 0, accuracy: response.accuracy };
      }

      const starts = response.rows.map((r) => new Date(r.intervalStart));
      await this.prisma.$transaction([
        this.prisma.forecast.deleteMany({
          where: {
            skillId: skill.id,
            channel,
            intervalStart: {
              gte: new Date(Math.min(...starts.map((s) => s.getTime()))),
              lte: new Date(Math.max(...starts.map((s) => s.getTime()))),
            },
          },
        }),
        this.prisma.forecast.createMany({
          data: response.rows.map((r) => ({
            skillId: skill.id,
            channel,
            intervalStart: new Date(r.intervalStart),
            intervalEnd: new Date(r.intervalEnd),
            forecastCalls: r.forecastCalls,
            forecastLower: r.forecastLower,
            forecastUpper: r.forecastUpper,
            requiredAgents: r.requiredAgents,
          })),
        }),
      ]);

      return { ...base, rows: response.rows.length, accuracy: response.accuracy };
    } catch (err) {
      this.logger.warn(`Forecast failed for ${skill.name}/${channel}: ${(err as Error).message}`);
      return { ...base, rows: 0, accuracy: null, error: (err as Error).message };
    }
  }

  // ============================================
  // READ
  // ============================================

  findAll(filter: { skill?: string; channel?: string; date?: string } = {}) {
    const day = filter.date ? utcMidnight(new Date(filter.date)) : null;

    return this.prisma.forecast.findMany({
      where: {
        ...(filter.channel && { channel: filter.channel }),
        ...(filter.skill && {
          skill: { name: { equals: filter.skill, mode: "insensitive" } },
        }),
        ...(day && {
          intervalStart: { gte: day, lt: new Date(day.getTime() + DAY_MS) },
        }),
      },
      include: { skill: true },
      orderBy: [{ intervalStart: "asc" }, { channel: "asc" }],
    });
  }

  /**
   * Multi-channel demand: per interval, calls and required agents for
   * Voice / Chat / Email side by side, plus per-channel totals.
   */
  async multiChannel(filter: { skill?: string; date?: string }) {
    const forecasts = await this.findAll(filter);

    const byInterval = new Map<
      string,
      {
        intervalStart: Date;
        channels: Record<string, { calls: number; requiredAgents: number }>;
        totalCalls: number;
        totalRequiredAgents: number;
      }
    >();
    const totals: Record<string, { calls: number; peakAgents: number }> = {};

    for (const f of forecasts) {
      const key = f.intervalStart.toISOString();
      const entry =
        byInterval.get(key) ??
        {
          intervalStart: f.intervalStart,
          channels: {},
          totalCalls: 0,
          totalRequiredAgents: 0,
        };
      const channel = (entry.channels[f.channel] ??= { calls: 0, requiredAgents: 0 });
      channel.calls += f.forecastCalls;
      channel.requiredAgents += f.requiredAgents ?? 0;
      entry.totalCalls += f.forecastCalls;
      entry.totalRequiredAgents += f.requiredAgents ?? 0;
      byInterval.set(key, entry);
    }

    for (const entry of byInterval.values()) {
      for (const [channel, v] of Object.entries(entry.channels)) {
        const t = (totals[channel] ??= { calls: 0, peakAgents: 0 });
        t.calls += v.calls;
        t.peakAgents = Math.max(t.peakAgents, v.requiredAgents);
      }
    }

    return { totals, intervals: [...byInterval.values()] };
  }
}
