-- AlterTable
ALTER TABLE "marketplace_events" ADD COLUMN     "amount" DECIMAL(20,6),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "eventType" DROP NOT NULL;
