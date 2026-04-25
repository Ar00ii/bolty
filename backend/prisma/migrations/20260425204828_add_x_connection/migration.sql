-- X (Twitter) connection: per-user OAuth row that lets agents post on
-- the user's behalf. Tokens are AES-256-GCM encrypted at the application
-- layer; nothing in here is sensitive enough to need column-level
-- encryption on top.

CREATE TABLE "x_connections" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "xUserId" TEXT NOT NULL,
    "screenName" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT NOT NULL,
    "postsLast24h" INTEGER NOT NULL DEFAULT 0,
    "postsWindowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "x_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "x_connections_userId_key" ON "x_connections"("userId");

ALTER TABLE "x_connections"
    ADD CONSTRAINT "x_connections_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
