-- Remove expiration fields from credit_packages table
ALTER TABLE "credit_packages" DROP COLUMN IF EXISTS "validityDays";

-- Remove expiration fields from entity_credit_balances table
ALTER TABLE "entity_credit_balances" DROP COLUMN IF EXISTS "expiresAt";

-- Remove expiration fields from credits table
ALTER TABLE "credits" DROP COLUMN IF EXISTS "expiresAt";

-- Add billingModel column to entities table and remove billingSettings
ALTER TABLE "entities" ADD COLUMN "billingModel" TEXT DEFAULT 'SEAT_BASED';
ALTER TABLE "entities" DROP COLUMN IF EXISTS "billingSettings";

-- Remove billingModel from teams table
ALTER TABLE "teams" DROP COLUMN IF EXISTS "billingModel";

-- Update existing entities to use SEAT_BASED as default
UPDATE "entities" SET "billingModel" = 'SEAT_BASED' WHERE "billingModel" IS NULL;

-- Make billingModel NOT NULL
ALTER TABLE "entities" ALTER COLUMN "billingModel" SET NOT NULL;
