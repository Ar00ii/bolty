-- Add agent protocol selector + protocol-specific config to MarketListing.
-- All columns are additive and either default to a known value or are
-- nullable, so this migration is safe to apply in-place against prod
-- without backfilling.
ALTER TABLE "market_listings"
  ADD COLUMN IF NOT EXISTS "agentProtocol" TEXT NOT NULL DEFAULT 'webhook';
ALTER TABLE "market_listings"
  ADD COLUMN IF NOT EXISTS "agentModel"    TEXT;
ALTER TABLE "market_listings"
  ADD COLUMN IF NOT EXISTS "agentApiKey"   TEXT;
