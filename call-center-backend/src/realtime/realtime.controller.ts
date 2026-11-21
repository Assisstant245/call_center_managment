import { Body, Controller, Get, Post } from "@nestjs/common";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

import { RealtimeService } from "./realtime.service";
import { Roles } from "../common/security/roles.decorator";
import { REVIEWER_ROLES } from "../common/security/roles";

class QueueMetricsDto {
  @IsString()
  @IsNotEmpty()
  skill: string;

  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsInt()
  @Min(0)
  waiting: number;

  @IsInt()
  @Min(0)
  activeContacts: number;

  @IsInt()
  @Min(0)
  longestWaitSec: number;
}

@Controller("realtime")
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  /** Live staffing for the current interval (also pushed via WebSocket). */
  @Get("staffing")
  staffing() {
    return this.realtime.getLiveStaffing();
  }

  @Get("queue-metrics")
  queueMetrics() {
    return this.realtime.getQueueMetrics();
  }

  /** Called by the ACD / phone-system integration to publish queue state. */
  @Roles(...REVIEWER_ROLES)
  @Post("queue-metrics")
  updateQueueMetrics(@Body() dto: QueueMetricsDto) {
    return this.realtime.updateQueueMetrics(dto);
  }
}
