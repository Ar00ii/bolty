-- Performance indexes for repositories, votes, and market_listings

CREATE INDEX IF NOT EXISTS "repositories_userId_idx" ON "repositories"("userId");
CREATE INDEX IF NOT EXISTS "repositories_language_idx" ON "repositories"("language");
CREATE INDEX IF NOT EXISTS "repositories_createdAt_idx" ON "repositories"("createdAt");
CREATE INDEX IF NOT EXISTS "repositories_downloadCount_idx" ON "repositories"("downloadCount");
CREATE INDEX IF NOT EXISTS "repositories_stars_idx" ON "repositories"("stars");

CREATE INDEX IF NOT EXISTS "votes_repositoryId_idx" ON "votes"("repositoryId");

CREATE INDEX IF NOT EXISTS "market_listings_type_status_idx" ON "market_listings"("type", "status");
