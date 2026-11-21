import { Controller, Get, Query } from "@nestjs/common";

import { DashboardService } from "./dashboard.service";
import { MyDashboardService } from "./my-dashboard.service";
import {
  CurrentUser,
  type AuthUser,
} from "../common/security/current-user.decorator";

@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly myDashboard: MyDashboardService,
  ) {}

  /** Personal dashboard for the logged-in agent. */
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.myDashboard.get(user);
  }

  @Get()
  async getDashboard(
    @Query("skill") skill?: string,
    @Query("date") date?: string,
    @Query("channel") channel?: string,
  ) {
    return this.dashboardService.getDashboard(skill, date, channel);
  }
}
