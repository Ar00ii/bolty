-- CreateIndex
CREATE INDEX IF NOT EXISTS "market_purchases_buyerId_createdAt_idx" ON "market_purchases"("buyerId", "createdAt");
