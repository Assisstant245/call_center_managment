-- CreateTable
CREATE TABLE "AgentSchedule" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "intervalStart" TIMESTAMP(3) NOT NULL,
    "intervalEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentSchedule_agentId_idx" ON "AgentSchedule"("agentId");

-- CreateIndex
CREATE INDEX "AgentSchedule_skillId_idx" ON "AgentSchedule"("skillId");

-- CreateIndex
CREATE INDEX "AgentSchedule_intervalStart_idx" ON "AgentSchedule"("intervalStart");

-- AddForeignKey
ALTER TABLE "AgentSchedule" ADD CONSTRAINT "AgentSchedule_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSchedule" ADD CONSTRAINT "AgentSchedule_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
