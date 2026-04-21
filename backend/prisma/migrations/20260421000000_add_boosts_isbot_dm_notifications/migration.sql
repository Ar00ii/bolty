-- Add new NotificationType variants (DM, friends, boost)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DM_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRIEND_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRIEND_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_BOOSTED';

-- Bot flag on users (chat seeder uses this to skip rate limits / hide from
-- "real" listings).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isBot" BOOLEAN NOT NULL DEFAULT false;

-- Boost timestamp on market_listings — set when a buyer purchases a boost.
-- Listings ranked higher in /market browse + ticker while non-null + future.
ALTER TABLE "market_listings" ADD COLUMN IF NOT EXISTS "boostedUntil" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "market_listings_boostedUntil_idx" ON "market_listings"("boostedUntil");

-- Receipt table for boost purchases (audit + per-buyer history)
CREATE TABLE IF NOT EXISTS "listing_boosts" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "listingId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "amountTokens" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "durationDays" INTEGER NOT NULL DEFAULT 7,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "listing_boosts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "listing_boosts_listingId_createdAt_idx" ON "listing_boosts"("listingId", "createdAt");
CREATE INDEX IF NOT EXISTS "listing_boosts_buyerId_createdAt_idx" ON "listing_boosts"("buyerId", "createdAt");

ALTER TABLE "listing_boosts"
  ADD CONSTRAINT "listing_boosts_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "market_listings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listing_boosts"
  ADD CONSTRAINT "listing_boosts_buyerId_fkey"
  FOREIGN KEY ("buyerId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
