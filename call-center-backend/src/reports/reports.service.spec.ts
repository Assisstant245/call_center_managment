import { BadRequestException } from "@nestjs/common";
import { ReportsService, parseCsv } from "./reports.service";

const HEADER =
  "interval_start,channel,skill,calls_offered,calls_answered,calls_abandoned,average_handle_time_sec,average_wait_time_sec";

describe("parseCsv", () => {
  it("parses rows into objects keyed by header", () => {
    const rows = parseCsv(`${HEADER}\n2026-04-01 08:00:00,Voice,Billing,10,9,1,300,20\n`);
    expect(rows).toHaveLength(1);
    expect(rows[0].skill).toBe("Billing");
    expect(rows[0].calls_offered).toBe("10");
  });

  it("handles Windows line endings", () => {
    expect(parseCsv(`${HEADER}\r\n2026-04-01 08:00:00,Chat,Sales,1,1,0,100,5\r\n`)).toHaveLength(1);
  });

  it("rejects a file with missing columns", () => {
    expect(() => parseCsv("a,b\n1,2")).toThrow(BadRequestException);
  });

  it("rejects a header-only file", () => {
    expect(() => parseCsv(HEADER)).toThrow(BadRequestException);
  });
});

describe("ReportsService.performance", () => {
  const row = (
    skill: string,
    channel: string,
    start: string,
    offered: number,
    answered: number,
    abandoned: number,
    aht: number,
    wait: number,
  ) => ({
    intervalStart: new Date(start),
    channel,
    skill: { name: skill },
    callsOffered: offered,
    callsAnswered: answered,
    callsAbandoned: abandoned,
    avgHandleSec: aht,
    avgWaitSec: wait,
  });

  const prisma = {
    callHistory: {
      findMany: jest.fn().mockResolvedValue([
        row("Billing", "Voice", "2026-04-01T08:00:00Z", 100, 90, 10, 300, 20),
        row("Billing", "Voice", "2026-04-01T08:30:00Z", 100, 100, 0, 200, 10),
        row("Sales", "Chat", "2026-04-02T08:00:00Z", 50, 50, 0, 400, 5),
      ]),
    },
  };
  const service = new ReportsService(prisma as never);

  it("computes weighted KPIs", async () => {
    const res = await service.performance({ groupBy: "day" });
    expect(res.summary.offered).toBe(250);
    expect(res.summary.abandoned).toBe(10);
    expect(res.summary.abandonRatePct).toBe(4);
    // (300*90 + 200*100 + 400*50) / 240 = 279
    expect(res.summary.avgHandleSec).toBe(279);
    expect(res.rows.map((r) => r.key)).toEqual(["2026-04-01", "2026-04-02"]);
  });

  it("groups by skill", async () => {
    const res = await service.performance({ groupBy: "skill" });
    expect(res.rows.find((r) => r.key === "Billing")?.offered).toBe(200);
  });
});
