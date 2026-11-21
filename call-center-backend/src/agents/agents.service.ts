import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { AssignShiftDto, CreateAgentDto } from "./dto/create-agent.dto";
import { findAgentForUser } from "../common/agent-lookup";
import type { AuthUser } from "../common/security/current-user.decorator";
import { utcMidnight } from "../agent-schedule/scheduler";

const withRelations = {
  agentSkills: { include: { skill: true } },
  agentShifts: { include: { shift: true } },
} as const;

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgentDto) {
    const email = dto.email.trim().toLowerCase();

    if (await this.prisma.agent.findUnique({ where: { employeeId: dto.employeeId } })) {
      throw new BadRequestException("Employee ID already exists");
    }
    if (await this.prisma.agent.findUnique({ where: { email } })) {
      throw new BadRequestException("Agent email already exists");
    }

    if (dto.skillIds?.length) {
      const skills = await this.prisma.skill.count({
        where: { id: { in: dto.skillIds }, status: "Active" },
      });
      if (skills !== new Set(dto.skillIds).size) {
        throw new BadRequestException("One or more selected skills are invalid");
      }
    }

    if (dto.shiftId) {
      const shift = await this.prisma.shift.findFirst({
        where: { id: dto.shiftId, status: "Active" },
      });
      if (!shift) throw new BadRequestException("Selected shift is invalid");
    }

    // Link to an existing user account with the same e-mail
    const user = await this.prisma.user.findUnique({ where: { email } });

    const agent = await this.prisma.agent.create({
      data: {
        employeeId: dto.employeeId,
        name: dto.name,
        email,
        phone: dto.phone || null,
        status: dto.status || "Offline",
        hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
        userId: user?.id ?? null,
        agentSkills: dto.skillIds?.length
          ? {
              create: [...new Set(dto.skillIds)].map((skillId) => ({
                skill: { connect: { id: skillId } },
              })),
            }
          : undefined,
        agentShifts:
          dto.shiftId && dto.workDate
            ? {
                create: {
                  shift: { connect: { id: dto.shiftId } },
                  workDate: utcMidnight(new Date(dto.workDate)),
                },
              }
            : undefined,
      },
      include: withRelations,
    });

    return { status: "success", data: agent };
  }

  async findAll() {
    const agents = await this.prisma.agent.findMany({
      include: withRelations,
      orderBy: { id: "asc" },
    });
    return { status: "success", data: agents };
  }

  async findMine(user: AuthUser) {
    const agent = await findAgentForUser(this.prisma, user);
    if (!agent) throw new NotFoundException("No agent profile linked to your account");

    return this.prisma.agent.findUnique({
      where: { id: agent.id },
      include: {
        agentSkills: { include: { skill: true } },
        agentShifts: {
          where: { workDate: { gte: utcMidnight(new Date()) } },
          include: { shift: true },
          orderBy: { workDate: "asc" },
        },
      },
    });
  }

  async assignShift(agentId: number, dto: AssignShiftDto) {
    const [agent, shift] = await Promise.all([
      this.prisma.agent.findUnique({ where: { id: agentId } }),
      this.prisma.shift.findFirst({ where: { id: dto.shiftId, status: "Active" } }),
    ]);
    if (!agent) throw new NotFoundException("Agent not found");
    if (!shift) throw new BadRequestException("Selected shift is invalid");

    const workDate = utcMidnight(new Date(dto.workDate));

    const onLeave = await this.prisma.timeOffRequest.findFirst({
      where: {
        agentId,
        status: "Approved",
        startDate: { lte: workDate },
        endDate: { gte: workDate },
      },
    });
    if (onLeave) {
      throw new BadRequestException("Agent has approved time off on that date");
    }

    // One shift per agent per day: assigning again replaces the shift type.
    return this.prisma.agentShift.upsert({
      where: { agentId_workDate: { agentId, workDate } },
      update: { shiftId: shift.id },
      create: { agentId, shiftId: shift.id, workDate },
      include: { shift: true },
    });
  }

  async assignSkills(agentId: number, skillIds: number[]) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException("Agent not found");

    const unique = [...new Set(skillIds)];
    const valid = await this.prisma.skill.count({
      where: { id: { in: unique }, status: "Active" },
    });
    if (valid !== unique.length) {
      throw new BadRequestException("One or more selected skills are invalid");
    }

    await this.prisma.agentSkill.createMany({
      data: unique.map((skillId) => ({ agentId, skillId })),
      skipDuplicates: true,
    });

    this.logger.log(`Agent ${agentId} skills updated`);
    return this.prisma.agent.findUnique({ where: { id: agentId }, include: withRelations });
  }

  async findAgentsForScheduling(workDate: string) {
    const date = utcMidnight(new Date(workDate));

    return this.prisma.agent.findMany({
      where: {
        agentShifts: { some: { workDate: date, shift: { status: "Active" } } },
      },
      include: {
        agentSkills: { include: { skill: true } },
        agentShifts: { where: { workDate: date }, include: { shift: true } },
      },
      orderBy: { id: "asc" },
    });
  }
}
