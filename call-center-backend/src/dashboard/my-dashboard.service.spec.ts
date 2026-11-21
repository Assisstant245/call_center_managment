import { toBlocks } from "./my-dashboard.service";

const slot = (hhmm: string, skill = "Billing", channel = "Voice") => {
  const start = new Date(`2026-05-01T${hhmm}:00Z`);
  return {
    skill: { name: skill },
    channel,
    intervalStart: start,
    intervalEnd: new Date(start.getTime() + 30 * 60000),
  };
};

describe("toBlocks", () => {
  it("joins consecutive slots of the same skill and channel", () => {
    const blocks = toBlocks([slot("09:00"), slot("09:30"), slot("10:00")]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].start.toISOString()).toBe("2026-05-01T09:00:00.000Z");
    expect(blocks[0].end.toISOString()).toBe("2026-05-01T10:30:00.000Z");
  });

  it("splits when the channel changes or there is a gap", () => {
    const blocks = toBlocks([
      slot("09:00"),
      slot("09:30", "Billing", "Chat"),
      slot("11:00", "Billing", "Chat"),
    ]);
    expect(blocks.map((b) => b.channel)).toEqual(["Voice", "Chat", "Chat"]);
  });

  it("sorts unordered input", () => {
    const blocks = toBlocks([slot("09:30"), slot("09:00")]);
    expect(blocks).toHaveLength(1);
  });
});
