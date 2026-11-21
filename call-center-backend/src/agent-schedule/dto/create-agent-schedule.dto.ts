import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateAgentScheduleDto {
  @IsInt()
  agentId: number;

  @IsInt()
  skillId: number;

  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsDateString()
  intervalStart: string;

  @IsDateString()
  intervalEnd: string;
}

export class GenerateScheduleDto {
  @IsDateString()
  intervalStart: string;

  @IsString()
  @IsNotEmpty()
  skill: string;

  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsInt()
  @Min(1)
  requiredAgents: number;
}

export class GenerateDayScheduleDto {
  /** YYYY-MM-DD (UTC) */
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  channel?: string;
}
