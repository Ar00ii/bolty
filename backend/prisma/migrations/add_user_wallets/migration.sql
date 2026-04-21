-- Additional wallets a user has linked, on top of the primary
-- `users.walletAddress` column. Lets the buyer pick which wallet to pay
-- from before purchase, and lets the profile list labeled wallets.

CREATE TYPE "WalletProvider" AS ENUM (
  'METAMASK',
  'WALLETCONNECT',
  'COINBASE',
  'RAINBOW',
  'UNISWAP',
  'OTHER'
);

CREATE TABLE "user_wallets" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "label" TEXT,
  "provider" "WalletProvider" NOT NULL DEFAULT 'OTHER',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_wallets_userId_address_key"
  ON "user_wallets"("userId", "address");

CREATE INDEX "user_wallets_userId_idx" ON "user_wallets"("userId");

ALTER TABLE "user_wallets"
  ADD CONSTRAINT "user_wallets_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: for every user who already has a primary walletAddress, create
-- a corresponding user_wallets row so the profile UI is consistent with
-- the auth wallet.
INSERT INTO "user_wallets" ("id", "userId", "address", "provider", "isPrimary", "createdAt")
SELECT
  'uw_' || substr(md5(random()::text || clock_timestamp()::text), 1, 22),
  u."id",
  u."walletAddress",
  'METAMASK'::"WalletProvider",
  true,
  COALESCE(u."createdAt", CURRENT_TIMESTAMP)
FROM "users" u
WHERE u."walletAddress" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "user_wallets" uw
    WHERE uw."userId" = u."id" AND uw."address" = u."walletAddress"
  );
