-- AlterTable
ALTER TABLE "AgentSchedule" ADD COLUMN     "forecastId" INTEGER;

-- CreateIndex
CREATE INDEX "AgentSchedule_forecastId_idx" ON "AgentSchedule"("forecastId");

-- AddForeignKey
ALTER TABLE "AgentSchedule" ADD CONSTRAINT "AgentSchedule_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "forecasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
