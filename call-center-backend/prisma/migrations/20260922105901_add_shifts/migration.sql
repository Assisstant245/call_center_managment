/*
  Warnings:

  - You are about to drop the column `updated_at` on the `skills` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `skills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "skills" DROP COLUMN "updated_at",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "shifts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "break_minutes" INTEGER,
    "status" VARCHAR(30) NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_shifts" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "shift_id" INTEGER NOT NULL,
    "work_date" DATE NOT NULL,

    CONSTRAINT "agent_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_shifts_agent_id_work_date_key" ON "agent_shifts"("agent_id", "work_date");

-- AddForeignKey
ALTER TABLE "agent_shifts" ADD CONSTRAINT "agent_shifts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_shifts" ADD CONSTRAINT "agent_shifts_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
