-- AlterTable: surface last 4 chars of the raw key for UI identification
ALTER TABLE "user_api_keys" ADD COLUMN IF NOT EXISTS "keyLastFour" TEXT;
ALTER TABLE "agent_api_keys" ADD COLUMN IF NOT EXISTS "keyLastFour" TEXT;
