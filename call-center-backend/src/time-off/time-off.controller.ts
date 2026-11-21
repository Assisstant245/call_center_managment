import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import { TimeOffService } from "./time-off.service";
import { Roles } from "../common/security/roles.decorator";
import { REVIEWER_ROLES } from "../common/security/roles";
import {
  CurrentUser,
  type AuthUser,
} from "../common/security/current-user.decorator";

export const TIME_OFF_TYPES = ["Vacation", "Sick", "Personal", "Unpaid"] as const;

class CreateTimeOffDto {
  @IsOptional()
  @IsInt()
  agentId?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn([...TIME_OFF_TYPES])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

class ReviewDto {
  @IsIn(["Approved", "Rejected"])
  decision: "Approved" | "Rejected";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@Controller("time-off")
export class TimeOffController {
  constructor(private readonly timeOff: TimeOffService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTimeOffDto) {
    return this.timeOff.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query("status") status?: string) {
    return this.timeOff.findAll(user, status);
  }

  @Roles(...REVIEWER_ROLES)
  @Patch(":id/review")
  review(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReviewDto,
  ) {
    return this.timeOff.review(user, id, dto.decision, dto.note);
  }

  @Patch(":id/cancel")
  cancel(@CurrentUser() user: AuthUser, @Param("id", ParseIntPipe) id: number) {
    return this.timeOff.cancel(user, id);
  }
}
