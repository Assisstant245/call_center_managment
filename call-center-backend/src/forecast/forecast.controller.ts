import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { IsBoolean, IsOptional } from "class-validator";

import { ForecastService } from "./forecast.service";
import {
  CreateForecastDto,
  GenerateForecastDto,
} from "./dto/create-forecast.dto";
import { Roles } from "../common/security/roles.decorator";
import { MANAGEMENT_ROLES } from "../common/security/roles";

class GenerateBodyDto extends GenerateForecastDto {
  @IsOptional()
  @IsBoolean()
  withAccuracy?: boolean;
}

@Controller("forecast")
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  /** Store a forecast interval manually. */
  @Roles(...MANAGEMENT_ROLES)
  @Post()
  create(@Body() data: CreateForecastDto) {
    return this.forecastService.create(data);
  }

  /** Run Prophet + Erlang C for every active skill/channel and store the result. */
  @Roles(...MANAGEMENT_ROLES)
  @Post("generate")
  generate(@Body() data: GenerateBodyDto) {
    return this.forecastService.generate(data);
  }

  @Get()
  findAll(
    @Query("skill") skill?: string,
    @Query("channel") channel?: string,
    @Query("date") date?: string,
  ) {
    return this.forecastService.findAll({ skill, channel, date });
  }

  /** Voice / Chat / Email demand side by side. */
  @Get("multi-channel")
  multiChannel(@Query("skill") skill?: string, @Query("date") date?: string) {
    return this.forecastService.multiChannel({ skill, date });
  }
}
