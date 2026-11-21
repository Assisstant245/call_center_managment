-- CreateTable
CREATE TABLE "forecasts" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "intervalStart" TIMESTAMP(3) NOT NULL,
    "intervalEnd" TIMESTAMP(3) NOT NULL,
    "forecastCalls" INTEGER NOT NULL,
    "forecastLower" INTEGER,
    "forecastUpper" INTEGER,
    "requiredAgents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forecasts_skillId_idx" ON "forecasts"("skillId");

-- CreateIndex
CREATE INDEX "forecasts_intervalStart_idx" ON "forecasts"("intervalStart");

-- AddForeignKey
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
