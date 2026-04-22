-- Add new ReputationReason values for buyer-side rewards.
-- Postgres cannot add multiple enum values in a transaction block, so each
-- ALTER runs independently. Uses IF NOT EXISTS so the migration is
-- idempotent on rollback/replay.
ALTER TYPE "ReputationReason" ADD VALUE IF NOT EXISTS 'REPO_PURCHASED';
ALTER TYPE "ReputationReason" ADD VALUE IF NOT EXISTS 'LISTING_PURCHASED';
ALTER TYPE "ReputationReason" ADD VALUE IF NOT EXISTS 'FIRST_PURCHASE';
