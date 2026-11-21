import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { CommonModule } from "./common/common.module";
import { SecurityModule } from "./common/security/security.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { NotificationsModule } from "./notifications/notifications.module";

import { AuthModule } from "./auth/auth.module";
import { AuthLoginModule } from "./authLogin/authLogin.module";
import { UsersModule } from "./users/users.module";
import { AgentsModule } from "./agents/agents.module";
import { SkillsModule } from "./skills/skills.module";
import { ShiftsModule } from "./shifts/shifts.module";
import { AgentScheduleModule } from "./agent-schedule/agent-schedule.module";
import { ForecastModule } from "./forecast/forecast.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { TimeOffModule } from "./time-off/time-off.module";
import { ShiftSwapsModule } from "./shift-swaps/shift-swaps.module";
import { AdherenceModule } from "./adherence/adherence.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // infrastructure
    PrismaModule,
    CommonModule,
    SecurityModule,
    RealtimeModule,
    NotificationsModule,

    // features
    AuthModule,
    AuthLoginModule,
    UsersModule,
    AgentsModule,
    SkillsModule,
    ShiftsModule,
    AgentScheduleModule,
    ForecastModule,
    DashboardModule,
    TimeOffModule,
    ShiftSwapsModule,
    AdherenceModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
