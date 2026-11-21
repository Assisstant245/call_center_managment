import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";

import { ReportsService } from "./reports.service";
import { Roles } from "../common/security/roles.decorator";
import { MANAGEMENT_ROLES, REVIEWER_ROLES } from "../common/security/roles";

class ReportQuery {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsIn(["day", "skill", "channel", "hour"])
  groupBy?: "day" | "skill" | "channel" | "hour";
}

class ImportDto {
  @IsString()
  csv: string;
}

@Roles(...REVIEWER_ROLES)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** Upload historical call data (CSV text) used for reports and forecasting. */
  @Roles(...MANAGEMENT_ROLES)
  @Post("import")
  import(@Body() dto: ImportDto) {
    return this.reports.importCsv(dto.csv);
  }

  @Get("performance")
  performance(@Query() query: ReportQuery) {
    return this.reports.performance(query);
  }

  @Get("forecast-accuracy")
  forecastAccuracy(@Query() query: ReportQuery) {
    return this.reports.forecastAccuracy(query);
  }
}
