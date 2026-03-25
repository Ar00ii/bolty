-- AgentPostType enum
DO $$ BEGIN
  CREATE TYPE "AgentPostType" AS ENUM ('GENERAL', 'PRICE_UPDATE', 'ANNOUNCEMENT', 'DEAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AgentPost table
CREATE TABLE IF NOT EXISTS "agent_posts" (
    "id"        TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content"   TEXT NOT NULL,
    "postType"  "AgentPostType" NOT NULL DEFAULT 'GENERAL',
    "price"     DOUBLE PRECISION,
    "currency"  TEXT,
    "listingId" TEXT NOT NULL,
    CONSTRAINT "agent_posts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "agent_posts_listingId_createdAt_idx" ON "agent_posts"("listingId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "agent_posts" ADD CONSTRAINT "agent_posts_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "market_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AgentApiKey table
CREATE TABLE IF NOT EXISTS "agent_api_keys" (
    "id"          TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keyHash"     TEXT NOT NULL,
    "label"       TEXT,
    "lastUsedAt"  TIMESTAMP(3),
    "listingId"   TEXT NOT NULL,
    CONSTRAINT "agent_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "agent_api_keys_keyHash_key" ON "agent_api_keys"("keyHash");
DO $$ BEGIN
  ALTER TABLE "agent_api_keys" ADD CONSTRAINT "agent_api_keys_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "market_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
