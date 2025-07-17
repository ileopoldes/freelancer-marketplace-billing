/*
  Warnings:

  - You are about to drop the column `validityDays` on the `credit_packages` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `credits` table. All the data in the column will be lost.
  - You are about to drop the column `billingSettings` on the `entities` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `entity_credit_balances` table. All the data in the column will be lost.
  - You are about to drop the column `billingModel` on the `teams` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "credit_packages" DROP COLUMN "validityDays";

-- AlterTable
ALTER TABLE "credits" DROP COLUMN "expiresAt";

-- AlterTable
ALTER TABLE "entities" DROP COLUMN "billingSettings",
ADD COLUMN     "billingModel" TEXT NOT NULL DEFAULT 'SEAT_BASED';

-- AlterTable
ALTER TABLE "entity_credit_balances" DROP COLUMN "expiresAt";

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "billingModel";
