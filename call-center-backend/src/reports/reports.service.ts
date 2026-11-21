import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { DAY_MS, utcMidnight } from "../agent-schedule/scheduler";

export interface HistoryRow {
  interval_start: string;
  channel: string;
  skill: string;
  calls_offered: string;
  calls_answered: string;
  calls_abandoned: string;
  average_handle_time_sec: string;
  average_wait_time_sec: string;
}

const REQUIRED_COLUMNS = [
  "interval_start",
  "channel",
  "skill",
  "calls_offered",
  "calls_answered",
  "calls_abandoned",
  "average_handle_time_sec",
  "average_wait_time_sec",
];

/** Minimal CSV parser (header row + comma separated, no quoted commas). */
export function parseCsv(text: string): HistoryRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new BadRequestException("CSV has no data rows");

  const header = lines[0].split(",").map((h) => h.trim());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    throw new BadRequestException(`CSV is missing columns: ${missing.join(", ")}`);
  }

  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()])) as unknown as HistoryRow;
  });
}

interface Agg {
  offered: number;
  answered: number;
  abandoned: number;
  handleWeighted: number;
  waitWeighted: number;
}

const emptyAgg = (): Agg => ({
  offered: 0,
  answered: 0,
  abandoned: 0,
  handleWeighted: 0,
  waitWeighted: 0,
});

const finish = (a: Agg) => ({
  offered: a.offered,
  answered: a.answered,
  abandoned: a.abandoned,
  answerRatePct: a.offered ? Number(((a.answered / a.offered) * 100).toFixed(1)) : null,
  abandonRatePct: a.offered ? Number(((a.abandoned / a.offered) * 100).toFixed(1)) : null,
  avgHandleSec: a.answered ? Math.round(a.handleWeighted / a.answered) : null,
  avgWaitSec: a.answered ? Number((a.waitWeighted / a.answered).toFixed(1)) : null,
});

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // IMPORT HISTORICAL DATA
  // ============================================

  async importCsv(csv: string) {
    const rows = parseCsv(csv);

    // Make sure every skill exists
    const skillNames = [...new Set(rows.map((r) => r.skill))];
    const skillIds = new Map<string, number>();
    for (const name of skillNames) {
      const skill = await this.prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name, description: "Imported from call history" },
      });
      skillIds.set(name, skill.id);
    }

    const data = rows.map((r, index) => {
      const intervalStart = new Date(
        /[zZ]|[+-]\d\d:?\d\d$/.test(r.interval_start)
          ? r.interval_start
          : `${r.interval_start.replace(" ", "T")}Z`,
      );
      const nums = [
        r.calls_offered,
        r.calls_answered,
        r.calls_abandoned,
        r.average_handle_time_sec,
        r.average_wait_time_sec,
      ].map(Number);

      if (Number.isNaN(intervalStart.getTime()) || nums.some(Number.isNaN)) {
        throw new BadRequestException(`Invalid data on CSV line ${index + 2}`);
      }

      return {
        intervalStart,
        channel: r.channel,
        skillId: skillIds.get(r.skill)!,
        callsOffered: nums[0],
        callsAnswered: nums[1],
        callsAbandoned: nums[2],
        avgHandleSec: nums[3],
        avgWaitSec: nums[4],
      };
    });

    let inserted = 0;
    for (let i = 0; i < data.length; i += 1000) {
      const result = await this.prisma.callHistory.createMany({
        data: data.slice(i, i + 1000),
        skipDuplicates: true,
      });
      inserted += result.count;
    }

    return {
      success: true,
      rowsInFile: rows.length,
      inserted,
      skippedDuplicates: rows.length - inserted,
    };
  }

  // ============================================
  // HISTORICAL PERFORMANCE
  // ============================================

  async performance(filter: {
    from?: string;
    to?: string;
    skill?: string;
    channel?: string;
    groupBy?: "day" | "skill" | "channel" | "hour";
  }) {
    const groupBy = filter.groupBy ?? "day";
    const rows = await this.prisma.callHistory.findMany({
      where: this.historyWhere(filter),
      include: { skill: true },
      orderBy: { intervalStart: "asc" },
    });

    const total = emptyAgg();
    const groups = new Map<string, Agg>();

    for (const r of rows) {
      const key =
        groupBy === "skill"
          ? r.skill.name
          : groupBy === "channel"
            ? r.channel
            : groupBy === "hour"
              ? r.intervalStart.toISOString().slice(11, 16)
              : r.intervalStart.toISOString().slice(0, 10);

      const g = groups.get(key) ?? emptyAgg();
      for (const target of [g, total]) {
        target.offered += r.callsOffered;
        target.answered += r.callsAnswered;
        target.abandoned += r.callsAbandoned;
        target.handleWeighted += r.avgHandleSec * r.callsAnswered;
        target.waitWeighted += r.avgWaitSec * r.callsAnswered;
      }
      groups.set(key, g);
    }

    return {
      groupBy,
      summary: finish(total),
      rows: [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, agg]) => ({ key, ...finish(agg) })),
    };
  }

  // ============================================
  // FORECAST VS ACTUAL
  // ============================================

  async forecastAccuracy(filter: {
    from?: string;
    to?: string;
    skill?: string;
    channel?: string;
  }) {
    const intervalStart = this.range(filter);

    const [forecasts, actuals] = await Promise.all([
      this.prisma.forecast.findMany({
        where: {
          intervalStart,
          ...(filter.channel && { channel: filter.channel }),
          ...(filter.skill && {
            skill: { name: { equals: filter.skill, mode: "insensitive" } },
          }),
        },
        include: { skill: true },
      }),
      this.prisma.callHistory.findMany({ where: this.historyWhere(filter) }),
    ]);

    const actualByKey = new Map(
      actuals.map((a) => [
        `${a.skillId}|${a.channel}|${a.intervalStart.getTime()}`,
        a.callsOffered,
      ]),
    );

    let n = 0;
    let absErr = 0;
    let pctErr = 0;
    let pctN = 0;
    const byDay = new Map<string, { forecast: number; actual: number }>();

    for (const f of forecasts) {
      const actual = actualByKey.get(
        `${f.skillId}|${f.channel}|${f.intervalStart.getTime()}`,
      );
      if (actual === undefined) continue;

      n += 1;
      absErr += Math.abs(actual - f.forecastCalls);
      if (actual > 0) {
        pctErr += Math.abs(actual - f.forecastCalls) / actual;
        pctN += 1;
      }
      const day = f.intervalStart.toISOString().slice(0, 10);
      const d = byDay.get(day) ?? { forecast: 0, actual: 0 };
      d.forecast += f.forecastCalls;
      d.actual += actual;
      byDay.set(day, d);
    }

    return {
      comparedIntervals: n,
      mae: n ? Number((absErr / n).toFixed(2)) : null,
      mapePct: pctN ? Number(((pctErr / pctN) * 100).toFixed(2)) : null,
      daily: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
      note:
        n === 0
          ? "No overlap between stored forecasts and actual call history yet."
          : undefined,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private range(filter: { from?: string; to?: string }) {
    return {
      ...(filter.from && { gte: utcMidnight(new Date(filter.from)) }),
      ...(filter.to && {
        lt: new Date(utcMidnight(new Date(filter.to)).getTime() + DAY_MS),
      }),
    };
  }

  private historyWhere(filter: {
    from?: string;
    to?: string;
    skill?: string;
    channel?: string;
  }) {
    return {
      intervalStart: this.range(filter),
      ...(filter.channel && { channel: filter.channel }),
      ...(filter.skill && {
        skill: { name: { equals: filter.skill, mode: "insensitive" as const } },
      }),
    };
  }
}
