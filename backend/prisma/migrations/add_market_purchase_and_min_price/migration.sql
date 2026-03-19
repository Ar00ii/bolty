-- AddColumn: minPrice to market_listings
ALTER TABLE "market_listings" ADD COLUMN IF NOT EXISTS "minPrice" DOUBLE PRECISION;

-- CreateTable: market_purchases
CREATE TABLE IF NOT EXISTS "market_purchases" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,
    "amountWei" TEXT NOT NULL DEFAULT '0',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "negotiationId" TEXT,

    CONSTRAINT "market_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "market_purchases_txHash_key" ON "market_purchases"("txHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "market_purchases_buyerId_listingId_idx" ON "market_purchases"("buyerId", "listingId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "market_purchases" ADD CONSTRAINT "market_purchases_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "market_purchases" ADD CONSTRAINT "market_purchases_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "market_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
