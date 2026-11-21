import { Global, Module } from "@nestjs/common";
import { RealtimeController } from "./realtime.controller";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";
import { RedisService } from "./redis.service";

@Global()
@Module({
  controllers: [RealtimeController],
  providers: [RealtimeGateway, RealtimeService, RedisService],
  exports: [RealtimeService, RealtimeGateway],
})
export class RealtimeModule {}
