import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export const CHANNELS = ["Voice", "Chat", "Email"] as const;

export class CreateForecastDto {
  @IsDateString()
  intervalStart: string;

  @IsDateString()
  intervalEnd: string;

  @IsString()
  skill: string;

  @IsString()
  channel: string;

  @IsNumber()
  @Min(0)
  forecastCalls: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  forecastLower?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  forecastUpper?: number;

  @IsInt()
  @Min(0)
  requiredAgents: number;
}

export class GenerateForecastDto {
  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsIn([...CHANNELS])
  channel?: string;

  /** First day to forecast (YYYY-MM-DD, UTC). Default: tomorrow. */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** Number of 30-minute intervals to forecast (default 29 = one opening day). */
  @IsOptional()
  @IsInt()
  @Min(1)
  intervals?: number;
}
