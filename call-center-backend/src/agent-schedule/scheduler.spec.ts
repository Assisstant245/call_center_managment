import {
  DemandSlot,
  SLOT_MS,
  SchedulableAgent,
  greedySchedule,
  shiftWindow,
  slotStartsInWindows,
} from "./scheduler";

const at = (iso: string) => new Date(iso);
const ms = (iso: string) => new Date(iso).getTime();

describe("shiftWindow", () => {
  it("builds a same-day window from the UTC time of day", () => {
    const w = shiftWindow(
      at("2026-05-01T00:00:00Z"),
      at("1970-01-01T09:00:00Z"),
      at("1970-01-01T17:00:00Z"),
    );
    expect(w.start).toBe(ms("2026-05-01T09:00:00Z"));
    expect(w.end).toBe(ms("2026-05-01T17:00:00Z"));
  });

  it("lets night shifts run into the next day", () => {
    const w = shiftWindow(
      at("2026-05-01T00:00:00Z"),
      at("1970-01-01T22:00:00Z"),
      at("1970-01-01T06:00:00Z"),
    );
    expect(w.start).toBe(ms("2026-05-01T22:00:00Z"));
    expect(w.end).toBe(ms("2026-05-02T06:00:00Z"));
  });

  it("ignores the date part stored in the shift timestamps", () => {
    const w = shiftWindow(
      at("2026-05-01T00:00:00Z"),
      at("2026-09-18T09:30:00Z"),
      at("2026-09-18T12:00:00Z"),
    );
    expect(w.start).toBe(ms("2026-05-01T09:30:00Z"));
  });
});

describe("slotStartsInWindows", () => {
  it("returns only slots that fit completely in the window", () => {
    const slots = slotStartsInWindows(
      [{ start: ms("2026-05-01T09:00:00Z"), end: ms("2026-05-01T10:15:00Z") }],
      ms("2026-05-01T00:00:00Z"),
      ms("2026-05-02T00:00:00Z"),
    );
    expect(slots).toEqual([
      ms("2026-05-01T09:00:00Z"),
      ms("2026-05-01T09:30:00Z"),
    ]);
  });

  it("respects the [from, to) range", () => {
    const slots = slotStartsInWindows(
      [{ start: ms("2026-05-01T22:00:00Z"), end: ms("2026-05-02T06:00:00Z") }],
      ms("2026-05-02T00:00:00Z"),
      ms("2026-05-02T01:00:00Z"),
    );
    expect(slots).toEqual([ms("2026-05-02T00:00:00Z"), ms("2026-05-02T00:30:00Z")]);
  });
});

describe("greedySchedule", () => {
  const start = ms("2026-05-01T10:00:00Z");
  const slot = (id: string, skillId: number, required: number, s = start): DemandSlot => ({
    id,
    skillId,
    channel: "Voice",
    start: s,
    required,
  });
  const agent = (id: number, skillIds: number[], starts = [start]): SchedulableAgent => ({
    id,
    skillIds,
    availableStarts: starts,
    busyStarts: [],
  });

  it("covers demand with skilled, available agents", () => {
    const res = greedySchedule([slot("a", 1, 2)], [agent(1, [1]), agent(2, [1]), agent(3, [2])]);
    expect(res.assignments.map((x) => x.agentId).sort()).toEqual([1, 2]);
    expect(res.coverage).toBe(1);
    expect(res.shortfalls).toEqual([]);
  });

  it("never books one agent twice at the same start time", () => {
    const res = greedySchedule(
      [slot("voice", 1, 1), slot("chat", 1, 1)],
      [agent(1, [1]), agent(2, [1])],
    );
    const ids = res.assignments.map((a) => a.agentId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(res.coverage).toBe(1);
  });

  it("reports a shortfall when there are not enough agents", () => {
    const res = greedySchedule([slot("a", 1, 3)], [agent(1, [1])]);
    expect(res.shortfalls).toEqual([{ slotId: "a", missing: 2 }]);
    expect(res.coverage).toBeCloseTo(0.3333, 3);
  });

  it("ignores agents who are off shift or already busy", () => {
    const offShift = agent(1, [1], [start + SLOT_MS]);
    const busy = { ...agent(2, [1]), busyStarts: [start] };
    const res = greedySchedule([slot("a", 1, 1)], [offShift, busy, agent(3, [1])]);
    expect(res.assignments).toEqual([{ slotId: "a", agentId: 3 }]);
  });

  it("balances load across agents over several slots", () => {
    const slots = [0, 1, 2, 3].map((i) => slot(`s${i}`, 1, 1, start + i * SLOT_MS));
    const starts = [0, 1, 2, 3].map((i) => start + i * SLOT_MS);
    const res = greedySchedule(slots, [agent(1, [1], starts), agent(2, [1], starts)]);
    const load = new Map<number, number>();
    res.assignments.forEach((a) => load.set(a.agentId, (load.get(a.agentId) ?? 0) + 1));
    expect(load.get(1)).toBe(2);
    expect(load.get(2)).toBe(2);
  });

  it("gives scarce slots to the only qualified agent first", () => {
    const res = greedySchedule(
      [slot("common", 1, 1), slot("rare", 2, 1)],
      [agent(1, [1, 2]), agent(2, [1])],
    );
    expect(res.coverage).toBe(1);
    expect(res.assignments.find((a) => a.slotId === "rare")?.agentId).toBe(1);
  });
});
