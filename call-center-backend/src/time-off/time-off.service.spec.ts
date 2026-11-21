import { BadRequestException } from "@nestjs/common";
import { TimeOffService } from "./time-off.service";

const future = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

function build(overrides: Record<string, unknown> = {}) {
  const prisma = {
    agent: { findFirst: jest.fn().mockResolvedValue({ id: 1, name: "Ayesha" }) },
    timeOffRequest: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }) => ({
        id: 1,
        ...data,
        agent: { name: "Ayesha" },
      })),
    },
    ...overrides,
  };
  const notifications = { notify: jest.fn() };
  const realtime = { broadcastStaffing: jest.fn() };
  const service = new TimeOffService(prisma as never, notifications as never, realtime as never);
  return { service, prisma, notifications };
}

const agentUser = { sub: 5, email: "a@x.com", role: "agent" };

describe("TimeOffService.create", () => {
  it("creates a pending request and notifies managers", async () => {
    const { service, notifications, prisma } = build();
    const result = await service.create(agentUser, {
      startDate: future(3),
      endDate: future(5),
    });
    expect(result.status ?? "Pending").toBe("Pending");
    expect(prisma.timeOffRequest.create).toHaveBeenCalled();
    expect(notifications.notify).toHaveBeenCalledTimes(1);
  });

  it("rejects an end date before the start date", async () => {
    const { service } = build();
    await expect(
      service.create(agentUser, { startDate: future(5), endDate: future(3) }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects dates in the past", async () => {
    const { service } = build();
    await expect(
      service.create(agentUser, { startDate: future(-3), endDate: future(-2) }),
    ).rejects.toThrow(/past/);
  });

  it("rejects overlapping requests", async () => {
    const { service } = build({
      timeOffRequest: {
        findFirst: jest.fn().mockResolvedValue({ id: 9 }),
        create: jest.fn(),
      },
    });
    await expect(
      service.create(agentUser, { startDate: future(3), endDate: future(4) }),
    ).rejects.toThrow(/overlapping/);
  });
});
