/*
  Warnings:

  - You are about to drop the `Agent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_userId_fkey";

-- DropTable
DROP TABLE "Agent";

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "employee_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30),
    "skills" TEXT[],
    "status" VARCHAR(30) NOT NULL DEFAULT 'Offline',
    "shift" VARCHAR(50),
    "hire_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_employee_id_key" ON "agents"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agents_userId_key" ON "agents"("userId");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
