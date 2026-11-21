import { Body, Controller, Post } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { Public } from "../common/security/public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }
}
