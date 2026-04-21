-- Add reputation reasons for publishing market listings and AI agents.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block that also
-- uses the new values, so each ADD is its own statement and we commit
-- before any code path references them.
ALTER TYPE "ReputationReason" ADD VALUE IF NOT EXISTS 'LISTING_PUBLISHED';
ALTER TYPE "ReputationReason" ADD VALUE IF NOT EXISTS 'AI_AGENT_PUBLISHED';
