import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from "class-validator";

export class CreateShiftDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  breakMinutes?: number;

  @IsOptional()
  @IsIn(["Active", "Inactive"])
  status?: string;
}
