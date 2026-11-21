import { computeAdherence, mergeIntervals } from "./adherence.calculator";

const t = (hhmm: string) => new Date(`2026-05-01T${hhmm}:00Z`).getTime();
const DAY_START = t("00:00");

describe("mergeIntervals", () => {
  it("merges overlapping and touching intervals", () => {
    expect(
      mergeIntervals([
        { start: 10, end: 20 },
        { start: 20, end: 30 },
        { start: 5, end: 12 },
        { start: 40, end: 50 },
      ]),
    ).toEqual([
      { start: 5, end: 30 },
      { start: 40, end: 50 },
    ]);
  });
});

describe("computeAdherence", () => {
  const schedule = [{ start: t("09:00"), end: t("11:00") }];

  it("is 100% when the agent works the whole schedule", () => {
    const r = computeAdherence(
      schedule,
      [{ state: "Available", at: t("08:55") }],
      "Offline",
      DAY_START,
      t("12:00"),
    );
    expect(r.scheduledMinutes).toBe(120);
    expect(r.adherencePct).toBe(100);
    expect(r.violations).toEqual([]);
  });

  it("treats an unreported day as Offline (0%)", () => {
    const r = computeAdherence(schedule, [], "Offline", DAY_START, t("12:00"));
    expect(r.adherencePct).toBe(0);
    expect(r.violations).toHaveLength(1);
    expect(r.violations[0].state).toBe("Offline");
  });

  it("subtracts break time and reports the violation", () => {
    const r = computeAdherence(
      schedule,
      [
        { state: "Available", at: t("09:00") },
        { state: "Break", at: t("10:00") },
        { state: "OnCall", at: t("10:30") },
      ],
      "Offline",
      DAY_START,
      t("12:00"),
    );
    expect(r.adherentMinutes).toBe(90);
    expect(r.adherencePct).toBe(75);
    expect(r.violations).toEqual([{ start: t("10:00"), end: t("10:30"), state: "Break" }]);
  });

  it("late login counts as non-adherent time", () => {
    const r = computeAdherence(
      schedule,
      [{ state: "Available", at: t("09:30") }],
      "Offline",
      DAY_START,
      t("12:00"),
    );
    expect(r.adherencePct).toBe(75);
  });

  it("only measures up to 'now' for an in-progress day", () => {
    const r = computeAdherence(
      schedule,
      [{ state: "Available", at: t("09:00") }],
      "Offline",
      DAY_START,
      t("10:00"),
    );
    expect(r.scheduledMinutes).toBe(60);
    expect(r.adherencePct).toBe(100);
  });

  it("uses the state carried over from the previous day", () => {
    const r = computeAdherence(schedule, [], "Available", DAY_START, t("12:00"));
    expect(r.adherencePct).toBe(100);
  });

  it("returns null when nothing is scheduled yet", () => {
    const r = computeAdherence([], [], "Offline", DAY_START, t("12:00"));
    expect(r.adherencePct).toBeNull();
  });
});
