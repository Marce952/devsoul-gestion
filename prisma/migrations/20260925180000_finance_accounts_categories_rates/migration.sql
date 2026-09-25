-- CreateEnum
CREATE TYPE "AccountProvider" AS ENUM ('UALA', 'BANK', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'INVOICE', 'TRANSFER', 'UALA_IMPORT', 'UALA_WEBHOOK');

-- CreateEnum
CREATE TYPE "RateSource" AS ENUM ('MANUAL', 'API');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'TRANSFER_IN';
ALTER TYPE "TransactionType" ADD VALUE 'TRANSFER_OUT';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "rateToArs" DECIMAL(14,4);

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "AccountProvider" NOT NULL,
    "currency" "Currency" NOT NULL,
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "openingDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "currency" "Currency" NOT NULL,
    "rateToArs" DECIMAL(14,4) NOT NULL,
    "source" "RateSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- AlterTable: new Transaction columns (nullable first to migrate existing rows)
ALTER TABLE "Transaction"
ADD COLUMN "accountId" TEXT,
ADD COLUMN "amountArs" DECIMAL(14,2),
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "externalId" TEXT,
ADD COLUMN "invoiceId" TEXT,
ADD COLUMN "rateToArs" DECIMAL(14,4) NOT NULL DEFAULT 1,
ADD COLUMN "reconciled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "source" "TransactionSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "transferGroupId" TEXT;

-- Data: one Ualá account per currency already used in transactions
INSERT INTO "FinancialAccount" ("id", "name", "provider", "currency", "openingBalance", "openingDate", "updatedAt")
SELECT gen_random_uuid()::text, 'Ualá ' || t."currency"::text, 'UALA', t."currency", 0, MIN(t."date"), CURRENT_TIMESTAMP
FROM "Transaction" t
GROUP BY t."currency";

UPDATE "Transaction" t
SET "accountId" = a."id"
FROM "FinancialAccount" a
WHERE a."name" = 'Ualá ' || t."currency"::text;

-- Data: categories from the old free-text column
INSERT INTO "TransactionCategory" ("id", "name", "type", "updatedAt")
SELECT gen_random_uuid()::text, c."name", c."type", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "category" AS "name", "type" FROM "Transaction") c;

UPDATE "Transaction" t
SET "categoryId" = c."id"
FROM "TransactionCategory" c
WHERE c."name" = t."category" AND c."type" = t."type";

-- Data: ARS equivalent (historical USD rows keep rate 1 until corrected manually)
UPDATE "Transaction" SET "amountArs" = "amount" * "rateToArs";

-- Data: link automatic invoice payments to their invoice
UPDATE "Transaction" t
SET "invoiceId" = i."id", "source" = 'INVOICE'
FROM "Invoice" i
WHERE t."category" = 'Factura cobrada'
  AND t."description" LIKE 'Factura #' || UPPER(RIGHT(i."id", 6)) || '%'
  AND i."status" = 'PAID';

-- AlterTable: enforce constraints and drop the old column
ALTER TABLE "Transaction"
ALTER COLUMN "accountId" SET NOT NULL,
ALTER COLUMN "amountArs" SET NOT NULL,
DROP COLUMN "category";

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_name_key" ON "FinancialAccount"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_name_type_key" ON "TransactionCategory"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currency_date_key" ON "ExchangeRate"("currency", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_invoiceId_key" ON "Transaction"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_externalId_key" ON "Transaction"("externalId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_transferGroupId_idx" ON "Transaction"("transferGroupId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
