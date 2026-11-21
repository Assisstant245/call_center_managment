import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";
import { getJwtSecret } from "./jwt-secret";

/**
 * Registers JWT once for the whole app and applies authentication +
 * role checks to every route by default (use @Public() to opt out).
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: getJwtSecret(),
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [JwtModule],
})
export class SecurityModule {}
