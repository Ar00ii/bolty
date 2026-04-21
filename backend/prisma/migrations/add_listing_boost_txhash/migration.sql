-- Track on-chain payment per boost so the same tx can't be replayed
ALTER TABLE "listing_boosts" ADD COLUMN IF NOT EXISTS "txHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "listing_boosts_txHash_key" ON "listing_boosts"("txHash");
