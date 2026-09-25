-- CreateEnum
CREATE TYPE "ReminderKind" AS ENUM ('BEFORE_DUE', 'DUE_DAY', 'OVERDUE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "recurringKey" TEXT;

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "kind" "ReminderKind" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT NOT NULL,
    "providerId" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderLog_status_idx" ON "ReminderLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_invoiceId_kind_channel_key" ON "ReminderLog"("invoiceId", "kind", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_recurringKey_key" ON "Invoice"("recurringKey");

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

