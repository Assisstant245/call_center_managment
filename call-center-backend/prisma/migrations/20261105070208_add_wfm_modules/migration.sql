-- AlterTable
ALTER TABLE "agent_shifts" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "agent_skills" ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "time_off_requests" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'Vacation',
    "reason" VARCHAR(500),
    "status" VARCHAR(30) NOT NULL DEFAULT 'Pending',
    "reviewed_by" INTEGER,
    "review_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_swap_requests" (
    "id" SERIAL NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,
    "requester_shift_id" INTEGER NOT NULL,
    "target_shift_id" INTEGER NOT NULL,
    "reason" VARCHAR(500),
    "status" VARCHAR(30) NOT NULL DEFAULT 'Pending',
    "reviewed_by" INTEGER,
    "review_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_swap_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adherence_events" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "state" VARCHAR(30) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adherence_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_history" (
    "id" SERIAL NOT NULL,
    "interval_start" TIMESTAMP(3) NOT NULL,
    "channel" VARCHAR(30) NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "calls_offered" INTEGER NOT NULL,
    "calls_answered" INTEGER NOT NULL,
    "calls_abandoned" INTEGER NOT NULL,
    "avg_handle_sec" DOUBLE PRECISION NOT NULL,
    "avg_wait_sec" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "call_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "title" VARCHAR(150) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'info',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_off_requests_agent_id_idx" ON "time_off_requests"("agent_id");

-- CreateIndex
CREATE INDEX "time_off_requests_status_idx" ON "time_off_requests"("status");

-- CreateIndex
CREATE INDEX "shift_swap_requests_status_idx" ON "shift_swap_requests"("status");

-- CreateIndex
CREATE INDEX "adherence_events_agent_id_occurred_at_idx" ON "adherence_events"("agent_id", "occurred_at");

-- CreateIndex
CREATE INDEX "call_history_interval_start_idx" ON "call_history"("interval_start");

-- CreateIndex
CREATE UNIQUE INDEX "call_history_interval_start_channel_skill_id_key" ON "call_history"("interval_start", "channel", "skill_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- AddForeignKey
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_shifts" ADD CONSTRAINT "agent_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_requester_shift_id_fkey" FOREIGN KEY ("requester_shift_id") REFERENCES "agent_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_target_shift_id_fkey" FOREIGN KEY ("target_shift_id") REFERENCES "agent_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adherence_events" ADD CONSTRAINT "adherence_events_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_history" ADD CONSTRAINT "call_history_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
