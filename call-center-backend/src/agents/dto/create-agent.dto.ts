import {
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export const AGENT_STATUSES = [
  "Offline",
  "Available",
  "OnCall",
  "Break",
  "Meeting",
] as const;

export class CreateAgentDto {
  @IsString()
  @MaxLength(50)
  employeeId: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  skillIds?: number[];

  @IsOptional()
  @IsInt()
  shiftId?: number;

  @IsOptional()
  @IsDateString()
  workDate?: string;

  @IsOptional()
  @IsIn([...AGENT_STATUSES])
  status?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;
}

export class AssignShiftDto {
  @IsInt()
  shiftId: number;

  @IsDateString()
  workDate: string;
}

export class AssignSkillsDto {
  @IsArray()
  @IsInt({ each: true })
  skillIds: number[];
}
