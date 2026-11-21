import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { MyDashboardService } from "./my-dashboard.service";
import { AdherenceModule } from "../adherence/adherence.module";

@Module({
  imports: [AdherenceModule],
  controllers: [DashboardController],
  providers: [DashboardService, MyDashboardService],
})
export class DashboardModule {}
