import { Global, Module } from "@nestjs/common";
import { ForecastClient } from "./forecast-client";

@Global()
@Module({
  providers: [ForecastClient],
  exports: [ForecastClient],
})
export class CommonModule {}
