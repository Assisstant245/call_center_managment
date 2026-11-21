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
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import { ShiftSwapsService } from "./shift-swaps.service";
import { Roles } from "../common/security/roles.decorator";
import { REVIEWER_ROLES } from "../common/security/roles";
import {
  CurrentUser,
  type AuthUser,
} from "../common/security/current-user.decorator";

class CreateSwapDto {
  /** AgentShift id of one of your own assignments */
  @IsInt()
  requesterShiftId: number;

  /** AgentShift id of the colleague's assignment you want */
  @IsInt()
  targetShiftId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

class RespondDto {
  @IsBoolean()
  accept: boolean;
}

class ReviewDto {
  @IsIn(["Approved", "Rejected"])
  decision: "Approved" | "Rejected";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@Controller("shift-swaps")
export class ShiftSwapsController {
  constructor(private readonly swaps: ShiftSwapsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSwapDto) {
    return this.swaps.create(user, dto);
  }

  @Get("candidates")
  candidates(
    @CurrentUser() user: AuthUser,
    @Query("shiftId", ParseIntPipe) shiftId: number,
  ) {
    return this.swaps.candidates(user, shiftId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query("status") status?: string) {
    return this.swaps.findAll(user, status);
  }

  @Patch(":id/respond")
  respond(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RespondDto,
  ) {
    return this.swaps.respond(user, id, dto.accept);
  }

  @Roles(...REVIEWER_ROLES)
  @Patch(":id/review")
  review(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReviewDto,
  ) {
    return this.swaps.review(user, id, dto.decision, dto.note);
  }

  @Patch(":id/cancel")
  cancel(@CurrentUser() user: AuthUser, @Param("id", ParseIntPipe) id: number) {
    return this.swaps.cancel(user, id);
  }
}
