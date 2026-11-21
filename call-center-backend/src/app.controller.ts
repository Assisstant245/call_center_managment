import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/security/public.decorator";

@Controller()
export class AppController {
  /** Liveness probe used by Docker / load balancers. */
  @Public()
  @Get("health")
  health() {
    return { status: "ok", time: new Date().toISOString() };
  }
}
