import { Body, Controller, HttpCode, Post } from "@nestjs/common";

import { AuthLoginService } from "./authLogin.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../common/security/public.decorator";

@Controller("auth")
export class AuthLoginController {
  constructor(private readonly authLoginService: AuthLoginService) {}

  @Public()
  @HttpCode(200)
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authLoginService.login(loginDto);
  }
}
