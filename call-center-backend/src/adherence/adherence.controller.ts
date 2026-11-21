import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

import { AdherenceService } from "./adherence.service";
import { ALL_STATES } from "./adherence.calculator";
import { Roles } from "../common/security/roles.decorator";
import { REVIEWER_ROLES } from "../common/security/roles";
import {
  CurrentUser,
  type AuthUser,
} from "../common/security/current-user.decorator";

class RecordEventDto {
  /** Supervisors/managers can set any agent; agents only themselves. */
  @IsOptional()
  @IsInt()
  agentId?: number;

  @IsIn([...ALL_STATES])
  state: string;

  @IsOptional()
  @IsDateString()
  at?: string;
}

class ReportQuery {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agentId?: number;
}

@Controller("adherence")
export class AdherenceController {
  constructor(private readonly adherence: AdherenceService) {}

  @Post("events")
  record(@CurrentUser() user: AuthUser, @Body() dto: RecordEventDto) {
    return this.adherence.recordEvent(user, dto);
  }

  @Roles(...REVIEWER_ROLES)
  @Get()
  report(@Query() query: ReportQuery) {
    return this.adherence.report(query);
  }
}
