import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RealtimeService } from "../realtime/realtime.service";
import { findAgentForUser, requireAgentForUser } from "../common/agent-lookup";
import type { AuthUser } from "../common/security/current-user.decorator";
import { MANAGEMENT_ROLES, REVIEWER_ROLES } from "../common/security/roles";
import { DAY_MS, utcMidnight } from "../agent-schedule/scheduler";

export interface CreateTimeOffInput {
  agentId?: number;
  startDate: string;
  endDate: string;
  type?: string;
  reason?: string;
}

const dateOnly = (iso: string) => utcMidnight(new Date(iso));

@Injectable()
export class TimeOffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(user: AuthUser, input: CreateTimeOffInput) {
    // Managers may file on behalf of any agent; everyone else only for themselves.
    const agent =
      input.agentId && MANAGEMENT_ROLES.includes(user.role as never)
        ? await this.prisma.agent.findUnique({ where: { id: input.agentId } })
        : await requireAgentForUser(this.prisma, user);

    if (!agent) throw new NotFoundException("Agent not found");

    const startDate = dateOnly(input.startDate);
    const endDate = dateOnly(input.endDate);
    const today = utcMidnight(new Date());

    if (endDate < startDate) {
      throw new BadRequestException("End date cannot be before start date");
    }
    if (startDate < today) {
      throw new BadRequestException("Time off cannot start in the past");
    }

    const overlap = await this.prisma.timeOffRequest.findFirst({
      where: {
        agentId: agent.id,
        status: { in: ["Pending", "Approved"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlap) {
      throw new BadRequestException(
        "You already have a pending or approved request overlapping these dates",
      );
    }

    const created = await this.prisma.timeOffRequest.create({
      data: {
        agentId: agent.id,
        startDate,
        endDate,
        type: input.type ?? "Vacation",
        reason: input.reason ?? null,
      },
      include: { agent: true },
    });

    await this.notifications.notify({
      title: "New time-off request",
      message: `${agent.name} requested ${created.type} from ${input.startDate.slice(0, 10)} to ${input.endDate.slice(0, 10)}.`,
      type: "info",
    });

    return created;
  }

  async findAll(user: AuthUser, status?: string) {
    let agentId: number | undefined;
    if (!REVIEWER_ROLES.includes(user.role as never)) {
      const agent = await findAgentForUser(this.prisma, user);
      if (!agent) return [];
      agentId = agent.id;
    }

    return this.prisma.timeOffRequest.findMany({
      where: { ...(agentId && { agentId }), ...(status && { status }) },
      include: { agent: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async review(
    reviewer: AuthUser,
    id: number,
    decision: "Approved" | "Rejected",
    note?: string,
  ) {
    const request = await this.prisma.timeOffRequest.findUnique({
      where: { id },
      include: { agent: true },
    });
    if (!request) throw new NotFoundException("Request not found");
    if (request.status !== "Pending") {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    const updated = await this.prisma.timeOffRequest.update({
      where: { id },
      data: { status: decision, reviewedBy: reviewer.sub, reviewNote: note ?? null },
      include: { agent: true },
    });

    let removedShifts = 0;
    if (decision === "Approved") {
      // Free the agent: drop already-generated schedule entries inside the leave.
      const removed = await this.prisma.agentSchedule.deleteMany({
        where: {
          agentId: request.agentId,
          status: "Scheduled",
          intervalStart: {
            gte: request.startDate,
            lt: new Date(request.endDate.getTime() + DAY_MS),
          },
        },
      });
      removedShifts = removed.count;
      if (removed.count > 0) void this.realtime.broadcastStaffing();
    }

    if (request.agent.userId) {
      await this.notifications.notify({
        userId: request.agent.userId,
        title: `Time-off ${decision.toLowerCase()}`,
        message: `Your ${request.type} request (${request.startDate.toISOString().slice(0, 10)} - ${request.endDate.toISOString().slice(0, 10)}) was ${decision.toLowerCase()}.${note ? ` Note: ${note}` : ""}`,
        type: decision === "Approved" ? "success" : "warning",
      });
    }

    if (removedShifts > 0) {
      await this.notifications.notify({
        title: "Schedule needs re-generation",
        message: `${request.agent.name}'s approved leave removed ${removedShifts} scheduled interval(s). Re-run auto scheduling for the affected days.`,
        type: "warning",
      });
    }

    return { ...updated, removedScheduleEntries: removedShifts };
  }

  async cancel(user: AuthUser, id: number) {
    const request = await this.prisma.timeOffRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("Request not found");

    const agent = await findAgentForUser(this.prisma, user);
    const isOwner = agent?.id === request.agentId;
    if (!isOwner && !MANAGEMENT_ROLES.includes(user.role as never)) {
      throw new ForbiddenException("You can only cancel your own requests");
    }
    if (request.status !== "Pending") {
      throw new BadRequestException("Only pending requests can be cancelled");
    }

    return this.prisma.timeOffRequest.update({
      where: { id },
      data: { status: "Cancelled" },
    });
  }
}
