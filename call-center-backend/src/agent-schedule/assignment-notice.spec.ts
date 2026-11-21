import { buildAssignmentNotices } from "./assignment-notice";

const row = (agentId: number, hhmm: string, skillId = 1, channel = "Voice") => {
  const start = new Date(`2026-11-11T${hhmm}:00Z`);
  return {
    agentId,
    skillId,
    channel,
    intervalStart: start,
    intervalEnd: new Date(start.getTime() + 30 * 60000),
  };
};

const names = new Map([
  [1, "Billing"],
  [2, "Sales"],
]);

describe("buildAssignmentNotices", () => {
  it("merges back-to-back slots into one block per agent", () => {
    const notices = buildAssignmentNotices(
      [row(7, "09:00"), row(7, "09:30"), row(7, "10:00")],
      names,
    );
    expect(notices.get(7)?.message).toContain("2026-11-11 09:00-10:30 Billing (Voice)");
  });

  it("creates a separate notice for each agent", () => {
    const notices = buildAssignmentNotices([row(1, "09:00"), row(2, "09:00", 2, "Chat")], names);
    expect(notices.size).toBe(2);
    expect(notices.get(2)?.message).toContain("Sales (Chat)");
  });

  it("splits blocks when the skill or channel changes", () => {
    const notices = buildAssignmentNotices(
      [row(1, "09:00"), row(1, "09:30", 2, "Voice")],
      names,
    );
    const msg = notices.get(1)!.message;
    expect(msg).toContain("Billing");
    expect(msg).toContain("Sales");
  });

  it("stays within the database column length for very long days", () => {
    const rows = Array.from({ length: 40 }, (_, i) =>
      row(1, `${String(8 + Math.floor(i / 4) * 0).padStart(2, "0")}:00`, (i % 2) + 1, i % 3 === 0 ? "Voice" : "Chat"),
    ).map((r, i) => ({
      ...r,
      intervalStart: new Date(Date.UTC(2026, 10, 11 + i, 9, 0)),
      intervalEnd: new Date(Date.UTC(2026, 10, 11 + i, 9, 30)),
    }));
    const msg = buildAssignmentNotices(rows, names).get(1)!.message;
    expect(msg.length).toBeLessThanOrEqual(480);
    expect(msg).toContain("more");
  });
});
