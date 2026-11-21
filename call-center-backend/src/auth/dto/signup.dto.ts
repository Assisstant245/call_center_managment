import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class SignupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(100)
  password: string;
}
