import { Module } from "@nestjs/common";

import { AuthLoginController } from "./authLogin.controller";
import { AuthLoginService } from "./authLogin.service";

@Module({
  controllers: [AuthLoginController],
  providers: [AuthLoginService],
})
export class AuthLoginModule {}
