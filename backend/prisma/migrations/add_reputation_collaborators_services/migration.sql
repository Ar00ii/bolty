-- AddColumn reputationPoints to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reputationPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum ReputationReason
DO $$ BEGIN
  CREATE TYPE "ReputationReason" AS ENUM (
    'REPO_PUBLISHED',
    'REPO_SOLD',
    'REPO_UPVOTE_RECEIVED',
    'LISTING_SOLD',
    'PROFILE_COMPLETED',
    'SERVICE_COMPLETED',
    'FIRST_SALE',
    'COLLABORATOR_ADDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable reputation_events
CREATE TABLE IF NOT EXISTS "reputation_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" "ReputationReason" NOT NULL,
    "resourceId" TEXT,
    "note" TEXT,

    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on reputation_events
CREATE INDEX IF NOT EXISTS "reputation_events_userId_createdAt_idx" ON "reputation_events"("userId", "createdAt");

-- AddForeignKey reputation_events -> users
DO $$ BEGIN
  ALTER TABLE "reputation_events"
    ADD CONSTRAINT "reputation_events_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum CollaboratorType
DO $$ BEGIN
  CREATE TYPE "CollaboratorType" AS ENUM ('USER', 'AI_AGENT', 'PROGRAM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable repo_collaborators
CREATE TABLE IF NOT EXISTS "repo_collaborators" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repositoryId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" "CollaboratorType" NOT NULL DEFAULT 'USER',
    "url" TEXT,
    "role" TEXT,

    CONSTRAINT "repo_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on repo_collaborators
CREATE UNIQUE INDEX IF NOT EXISTS "repo_collaborators_repositoryId_userId_key"
  ON "repo_collaborators"("repositoryId", "userId")
  WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "repo_collaborators_repositoryId_idx" ON "repo_collaborators"("repositoryId");

-- AddForeignKey repo_collaborators -> repositories
DO $$ BEGIN
  ALTER TABLE "repo_collaborators"
    ADD CONSTRAINT "repo_collaborators_repositoryId_fkey"
    FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey repo_collaborators -> users
DO $$ BEGIN
  ALTER TABLE "repo_collaborators"
    ADD CONSTRAINT "repo_collaborators_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum ServiceCategory
DO $$ BEGIN
  CREATE TYPE "ServiceCategory" AS ENUM (
    'AI_DEVELOPMENT',
    'SMART_CONTRACTS',
    'WEB_DEVELOPMENT',
    'BOT_DEVELOPMENT',
    'CONSULTING',
    'CODE_REVIEW',
    'MOBILE_DEVELOPMENT',
    'DEVOPS',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum ServiceStatus
DO $$ BEGIN
  CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable service_listings
CREATE TABLE IF NOT EXISTS "service_listings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minBudget" DOUBLE PRECISION,
    "maxBudget" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deliveryDays" INTEGER,
    "userId" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageUrl" TEXT,

    CONSTRAINT "service_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on service_listings
CREATE INDEX IF NOT EXISTS "service_listings_userId_status_idx" ON "service_listings"("userId", "status");
CREATE INDEX IF NOT EXISTS "service_listings_category_status_idx" ON "service_listings"("category", "status");

-- AddForeignKey service_listings -> users
DO $$ BEGIN
  ALTER TABLE "service_listings"
    ADD CONSTRAINT "service_listings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
