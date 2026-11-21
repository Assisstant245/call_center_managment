import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";

import { AgentScheduleService } from "./agent-schedule.service";
import {
  CreateAgentScheduleDto,
  GenerateDayScheduleDto,
  GenerateScheduleDto,
} from "./dto/create-agent-schedule.dto";
import { Roles } from "../common/security/roles.decorator";
import { MANAGEMENT_ROLES } from "../common/security/roles";
import {
  CurrentUser,
  type AuthUser,
} from "../common/security/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { findAgentForUser } from "../common/agent-lookup";

@Controller("agent-schedule")
export class AgentScheduleController {
  constructor(
    private readonly agentScheduleService: AgentScheduleService,
    private readonly prisma: PrismaService,
  ) {}

  /** Manually schedule one agent for a time range. */
  @Roles(...MANAGEMENT_ROLES)
  @Post()
  create(@Body() dto: CreateAgentScheduleDto) {
    return this.agentScheduleService.create({
      agentId: dto.agentId,
      skillId: dto.skillId,
      channel: dto.channel,
      intervalStart: new Date(dto.intervalStart),
      intervalEnd: new Date(dto.intervalEnd),
    });
  }

  /** Auto-schedule a single interval. */
  @Roles(...MANAGEMENT_ROLES)
  @Post("generate")
  generateSchedule(@Body() dto: GenerateScheduleDto) {
    return this.agentScheduleService.generateSchedule({
      intervalStart: new Date(dto.intervalStart),
      skill: dto.skill,
      channel: dto.channel,
      requiredAgents: dto.requiredAgents,
    });
  }

  /** Auto-schedule a whole day from the stored forecast. */
  @Roles(...MANAGEMENT_ROLES)
  @Post("generate-day")
  generateDay(@Body() dto: GenerateDayScheduleDto & { replaceExisting?: boolean }) {
    return this.agentScheduleService.generateDay({
      date: new Date(dto.date),
      skill: dto.skill,
      channel: dto.channel,
      replaceExisting: dto.replaceExisting === true,
    });
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query("date") date?: string,
    @Query("skill") skill?: string,
    @Query("channel") channel?: string,
  ) {
    // Plain agents only ever see their own schedule.
    let agentId: number | undefined;
    if (user.role === "agent") {
      const agent = await findAgentForUser(this.prisma, user);
      if (!agent) return [];
      agentId = agent.id;
    }

    return this.agentScheduleService.findAll({ date, skill, channel, agentId });
  }

  @Roles(...MANAGEMENT_ROLES)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.agentScheduleService.remove(id);
  }
}
