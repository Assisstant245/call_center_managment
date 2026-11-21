import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";

import { AgentsService } from "./agents.service";
import {
  AssignShiftDto,
  AssignSkillsDto,
  CreateAgentDto,
} from "./dto/create-agent.dto";
import { Roles } from "../common/security/roles.decorator";
import { MANAGEMENT_ROLES, REVIEWER_ROLES } from "../common/security/roles";
import {
  CurrentUser,
  type AuthUser,
} from "../common/security/current-user.decorator";

@Controller("agents")
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Roles(...REVIEWER_ROLES)
  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  /** The agent profile linked to the logged-in user (with upcoming shifts). */
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.agentsService.findMine(user);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Get("scheduling")
  findAgentsForScheduling(@Query("workDate") workDate: string) {
    return this.agentsService.findAgentsForScheduling(workDate);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Post()
  async create(@Body() createAgentDto: CreateAgentDto) {
    const agent = await this.agentsService.create(createAgentDto);
    return {
      status: "success",
      message: "Agent created successfully",
      data: agent,
    };
  }

  /** Assign a shift on a given date to an existing agent. */
  @Roles(...MANAGEMENT_ROLES)
  @Post(":id/shifts")
  assignShift(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AssignShiftDto,
  ) {
    return this.agentsService.assignShift(id, dto);
  }

  /** Add skills to an existing agent. */
  @Roles(...MANAGEMENT_ROLES)
  @Post(":id/skills")
  assignSkills(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AssignSkillsDto,
  ) {
    return this.agentsService.assignSkills(id, dto.skillIds);
  }
}
