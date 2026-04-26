-- Phase 2: autonomous tweeting + reply-to-mentions queue.
-- Additive migration: every column added is nullable or defaulted so
-- existing rows stay valid without backfill.

-- ── New columns on agent_x_connections ─────────────────────────────
ALTER TABLE "agent_x_connections"
  ADD COLUMN IF NOT EXISTS "autonomousEnabled"    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "postIntervalHours"    INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "requireApproval"      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "mentionsEnabled"      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "lastAutonomousAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mentionsLastSyncedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastMentionId"        TEXT;

-- ── New enums ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "AgentXPostStatus" AS ENUM (
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'POSTED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AgentXPostTrigger" AS ENUM (
    'SCHEDULED',
    'MENTION_REPLY',
    'MANUAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── New table for the post queue ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "agent_x_scheduled_posts" (
  "id"               TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  "listingId"        TEXT NOT NULL,
  "text"             TEXT NOT NULL,
  "reason"           TEXT,
  "context"          JSONB,
  "status"           "AgentXPostStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "triggerType"      "AgentXPostTrigger" NOT NULL DEFAULT 'SCHEDULED',
  "inReplyToTweetId" TEXT,
  "tweetId"          TEXT,
  "failureReason"    TEXT,
  "postedAt"         TIMESTAMP(3),

  CONSTRAINT "agent_x_scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- Indexes — listing+status for the queue UI, createdAt for history.
CREATE INDEX IF NOT EXISTS "agent_x_scheduled_posts_listingId_status_idx"
  ON "agent_x_scheduled_posts" ("listingId", "status");
CREATE INDEX IF NOT EXISTS "agent_x_scheduled_posts_createdAt_idx"
  ON "agent_x_scheduled_posts" ("createdAt");

-- FK: cascade delete with the X connection row.
ALTER TABLE "agent_x_scheduled_posts"
  ADD CONSTRAINT "agent_x_scheduled_posts_listingId_fkey"
  FOREIGN KEY ("listingId")
  REFERENCES "agent_x_connections" ("listingId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
