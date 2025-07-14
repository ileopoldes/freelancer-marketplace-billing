/*
  Warnings:

  - Added the required column `nextBillingDate` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "billingCycle" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "lastBilledAt" TIMESTAMP(3),
ADD COLUMN     "nextBillingDate" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Update existing contracts to have realistic nextBillingDate values
UPDATE "contracts" SET "nextBillingDate" = 
  CASE 
    WHEN random() < 0.3 THEN NOW() - INTERVAL '1 day' * (random() * 5)  -- 30% are overdue
    ELSE NOW() + INTERVAL '1 day' * (random() * 30 + 1)                 -- Others are due in future
  END
WHERE "nextBillingDate" = (SELECT "nextBillingDate" FROM "contracts" LIMIT 1);

-- Remove the default constraint after updating existing data
ALTER TABLE "contracts" ALTER COLUMN "nextBillingDate" DROP DEFAULT;
