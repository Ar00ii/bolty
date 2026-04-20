-- Add keyPrefix column to UserApiKey for O(1) lookup during verifyApiKey.
-- Without this, every API request bcrypt-compares against every row in
-- user_api_keys, which is both a perf problem and a DoS vector at scale.
ALTER TABLE "user_api_keys" ADD COLUMN IF NOT EXISTS "keyPrefix" TEXT;
CREATE INDEX IF NOT EXISTS "user_api_keys_keyPrefix_idx" ON "user_api_keys" ("keyPrefix");

-- Prevent the same buyer from creating two MarketPurchase rows against the
-- same listing through racing requests. Creates the constraint only when no
-- duplicates exist; if duplicates already exist, the index creation will
-- fail and you'll need to de-dupe manually (no known duplicates at time of
-- writing).
CREATE UNIQUE INDEX IF NOT EXISTS "market_purchases_listing_buyer_unique"
  ON "market_purchases" ("listingId", "buyerId");
