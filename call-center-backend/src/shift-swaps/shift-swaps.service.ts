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

const include = {
  requester: true,
  target: true,
  requesterShift: { include: { shift: true } },
  targetShift: { include: { shift: true } },
} as const;

@Injectable()
export class ShiftSwapsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(
    user: AuthUser,
    input: { requesterShiftId: number; targetShiftId: number; reason?: string },
  ) {
    const requester = await requireAgentForUser(this.prisma, user);

    const [mine, theirs] = await Promise.all([
      this.prisma.agentShift.findUnique({ where: { id: input.requesterShiftId } }),
      this.prisma.agentShift.findUnique({ where: { id: input.targetShiftId } }),
    ]);

    if (!mine || !theirs) throw new NotFoundException("Shift assignment not found");
    if (mine.agentId !== requester.id) {
      throw new ForbiddenException("The first shift must be one of your own shifts");
    }
    if (theirs.agentId === requester.id) {
      throw new BadRequestException("Choose a colleague's shift to swap with");
    }

    const today = utcMidnight(new Date());
    if (mine.workDate < today || theirs.workDate < today) {
      throw new BadRequestException("Past shifts cannot be swapped");
    }

    // Skill rule: both agents must share at least one skill so coverage is kept.
    const [mySkills, theirSkills] = await Promise.all([
      this.prisma.agentSkill.findMany({ where: { agentId: mine.agentId } }),
      this.prisma.agentSkill.findMany({ where: { agentId: theirs.agentId } }),
    ]);
    const shared = mySkills.some((a) =>
      theirSkills.some((b) => b.skillId === a.skillId),
    );
    if (!shared) {
      throw new BadRequestException(
        "Agents must share at least one skill to swap shifts",
      );
    }

    const pending = await this.prisma.shiftSwapRequest.findFirst({
      where: {
        status: { in: ["Pending", "Accepted"] },
        OR: [
          { requesterShiftId: { in: [mine.id, theirs.id] } },
          { targetShiftId: { in: [mine.id, theirs.id] } },
        ],
      },
    });
    if (pending) {
      throw new BadRequestException("One of these shifts is already in a pending swap");
    }

    const created = await this.prisma.shiftSwapRequest.create({
      data: {
        requesterId: mine.agentId,
        targetId: theirs.agentId,
        requesterShiftId: mine.id,
        targetShiftId: theirs.id,
        reason: input.reason ?? null,
      },
      include,
    });

    if (created.target.userId) {
      await this.notifications.notify({
        userId: created.target.userId,
        title: "Shift swap request",
        message: `${created.requester.name} would like to swap shifts with you (${created.requesterShift.workDate.toISOString().slice(0, 10)} <-> ${created.targetShift.workDate.toISOString().slice(0, 10)}).`,
      });
    }

    return created;
  }

  /** Colleague shifts an agent could swap with (future dates, shared skill). */
  async candidates(user: AuthUser, myShiftId: number) {
    const requester = await requireAgentForUser(this.prisma, user);
    const mine = await this.prisma.agentShift.findUnique({ where: { id: myShiftId } });
    if (!mine || mine.agentId !== requester.id) {
      throw new ForbiddenException("That is not one of your shifts");
    }

    const mySkills = await this.prisma.agentSkill.findMany({
      where: { agentId: requester.id },
      select: { skillId: true },
    });

    return this.prisma.agentShift.findMany({
      where: {
        agentId: { not: requester.id },
        workDate: { gte: utcMidnight(new Date()) },
        agent: { agentSkills: { some: { skillId: { in: mySkills.map((s) => s.skillId) } } } },
        swapsAsRequesterShift: { none: { status: { in: ["Pending", "Accepted"] } } },
        swapsAsTargetShift: { none: { status: { in: ["Pending", "Accepted"] } } },
      },
      include: { agent: { select: { id: true, name: true, employeeId: true } }, shift: true },
      orderBy: { workDate: "asc" },
      take: 100,
    });
  }

  async findAll(user: AuthUser, status?: string) {
    let agentId: number | undefined;
    if (!REVIEWER_ROLES.includes(user.role as never)) {
      const agent = await findAgentForUser(this.prisma, user);
      if (!agent) return [];
      agentId = agent.id;
    }

    return this.prisma.shiftSwapRequest.findMany({
      where: {
        ...(status && { status }),
        ...(agentId && { OR: [{ requesterId: agentId }, { targetId: agentId }] }),
      },
      include,
      orderBy: { createdAt: "desc" },
    });
  }

  /** Step 1: the colleague accepts or declines. */
  async respond(user: AuthUser, id: number, accept: boolean) {
    const swap = await this.getOrFail(id);
    const agent = await findAgentForUser(this.prisma, user);

    if (agent?.id !== swap.targetId && !MANAGEMENT_ROLES.includes(user.role as never)) {
      throw new ForbiddenException("Only the requested colleague can respond");
    }
    if (swap.status !== "Pending") {
      throw new BadRequestException(`Request is already ${swap.status}`);
    }

    const updated = await this.prisma.shiftSwapRequest.update({
      where: { id },
      data: { status: accept ? "Accepted" : "Rejected" },
      include,
    });

    if (accept) {
      await this.notifications.notify({
        title: "Shift swap awaiting approval",
        message: `${swap.requester.name} and ${swap.target.name} agreed to swap shifts. Please review.`,
      });
    }
    if (swap.requester.userId) {
      await this.notifications.notify({
        userId: swap.requester.userId,
        title: accept ? "Swap accepted by colleague" : "Swap declined",
        message: accept
          ? `${swap.target.name} accepted. Waiting for manager approval.`
          : `${swap.target.name} declined your swap request.`,
        type: accept ? "success" : "warning",
      });
    }

    return updated;
  }

  /** Step 2: a manager/supervisor approves (executes the swap) or rejects. */
  async review(
    reviewer: AuthUser,
    id: number,
    decision: "Approved" | "Rejected",
    note?: string,
  ) {
    const swap = await this.getOrFail(id);
    if (swap.status !== "Accepted") {
      throw new BadRequestException(
        swap.status === "Pending"
          ? "The colleague has not accepted this swap yet"
          : `Request is already ${swap.status}`,
      );
    }

    if (decision === "Approved") {
      await this.executeSwap(swap.requesterShiftId, swap.targetShiftId);
    }

    const updated = await this.prisma.shiftSwapRequest.update({
      where: { id },
      data: { status: decision, reviewedBy: reviewer.sub, reviewNote: note ?? null },
      include,
    });

    for (const agent of [swap.requester, swap.target]) {
      if (!agent.userId) continue;
      await this.notifications.notify({
        userId: agent.userId,
        title: `Shift swap ${decision.toLowerCase()}`,
        message: `The swap between ${swap.requester.name} and ${swap.target.name} was ${decision.toLowerCase()}.${note ? ` Note: ${note}` : ""}`,
        type: decision === "Approved" ? "success" : "warning",
      });
    }

    if (decision === "Approved") {
      await this.notifications.notify({
        title: "Schedule needs re-generation",
        message: `A shift swap between ${swap.requester.name} and ${swap.target.name} was approved. Their auto-generated intervals for those days were cleared - re-run scheduling.`,
        type: "warning",
      });
    }

    return updated;
  }

  async cancel(user: AuthUser, id: number) {
    const swap = await this.getOrFail(id);
    const agent = await findAgentForUser(this.prisma, user);

    if (agent?.id !== swap.requesterId && !MANAGEMENT_ROLES.includes(user.role as never)) {
      throw new ForbiddenException("Only the requester can cancel a swap");
    }
    if (!["Pending", "Accepted"].includes(swap.status)) {
      throw new BadRequestException(`Request is already ${swap.status}`);
    }

    return this.prisma.shiftSwapRequest.update({
      where: { id },
      data: { status: "Cancelled" },
      include,
    });
  }

  // ---------------------------------------------------------------

  private async getOrFail(id: number) {
    const swap = await this.prisma.shiftSwapRequest.findUnique({
      where: { id },
      include,
    });
    if (!swap) throw new NotFoundException("Swap request not found");
    return swap;
  }

  /** Atomically swaps who works the two shift assignments. */
  private async executeSwap(requesterShiftId: number, targetShiftId: number) {
    await this.prisma.$transaction(async (tx) => {
      const [a, b] = await Promise.all([
        tx.agentShift.findUnique({ where: { id: requesterShiftId } }),
        tx.agentShift.findUnique({ where: { id: targetShiftId } }),
      ]);
      if (!a || !b) throw new BadRequestException("A shift assignment no longer exists");

      const sameDay = a.workDate.getTime() === b.workDate.getTime();

      if (sameDay) {
        // Same date: the two agents simply exchange shift types.
        await tx.agentShift.update({ where: { id: a.id }, data: { shiftId: b.shiftId } });
        await tx.agentShift.update({ where: { id: b.id }, data: { shiftId: a.shiftId } });
      } else {
        const clash = await tx.agentShift.findFirst({
          where: {
            id: { notIn: [a.id, b.id] },
            OR: [
              { agentId: b.agentId, workDate: a.workDate },
              { agentId: a.agentId, workDate: b.workDate },
            ],
          },
        });
        if (clash) {
          throw new BadRequestException(
            "Swap would double-book an agent on one of the dates",
          );
        }
        await tx.agentShift.update({ where: { id: a.id }, data: { agentId: b.agentId } });
        await tx.agentShift.update({ where: { id: b.id }, data: { agentId: a.agentId } });
      }

      // Generated schedule entries for the touched agents/days are now stale.
      for (const agentId of [a.agentId, b.agentId]) {
        for (const date of [a.workDate, b.workDate]) {
          await tx.agentSchedule.deleteMany({
            where: {
              agentId,
              status: "Scheduled",
              intervalStart: {
                gte: date,
                lt: new Date(date.getTime() + 2 * DAY_MS),
              },
            },
          });
        }
      }
    });

    void this.realtime.broadcastStaffing();
  }
}
