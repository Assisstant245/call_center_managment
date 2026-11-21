import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSkillDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsIn(["Active", "Inactive"])
  status?: string;
}
