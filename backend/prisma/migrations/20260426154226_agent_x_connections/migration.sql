-- Per-listing X (Twitter) connections — each AI agent listing carries
-- its own X Developer App credentials + OAuth tokens. See schema.prisma
-- for shape rationale. Migration is purely additive (new table); safe
-- to apply in-place against prod with no backfill.
CREATE TABLE IF NOT EXISTS "agent_x_connections" (
  "id"               TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "listingId"        TEXT NOT NULL,
  "clientIdEnc"      TEXT NOT NULL,
  "clientSecretEnc"  TEXT NOT NULL,
  "xUserId"          TEXT,
  "screenName"       TEXT,
  "accessTokenEnc"   TEXT,
  "refreshTokenEnc"  TEXT,
  "expiresAt"        TIMESTAMP(3),
  "scopes"           TEXT,
  "postsLast24h"     INTEGER NOT NULL DEFAULT 0,
  "postsWindowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_x_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_x_connections_listingId_key"
  ON "agent_x_connections"("listingId");

ALTER TABLE "agent_x_connections"
  ADD CONSTRAINT "agent_x_connections_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "market_listings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
