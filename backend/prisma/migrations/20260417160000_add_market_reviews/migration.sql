-- CreateTable: market listing reviews (one per buyer per listing)
CREATE TABLE IF NOT EXISTS "market_reviews" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "listingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "market_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "market_reviews_listingId_authorId_key"
    ON "market_reviews"("listingId", "authorId");

CREATE INDEX IF NOT EXISTS "market_reviews_listingId_createdAt_idx"
    ON "market_reviews"("listingId", "createdAt");

ALTER TABLE "market_reviews"
    ADD CONSTRAINT "market_reviews_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "market_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "market_reviews"
    ADD CONSTRAINT "market_reviews_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
