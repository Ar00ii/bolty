-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING_DELIVERY', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NegotiationMode" AS ENUM ('AI_AI', 'HUMAN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "agent_negotiations"
  ADD COLUMN IF NOT EXISTS "humanSwitchAcceptedBy" TEXT[],
  ADD COLUMN IF NOT EXISTS "humanSwitchRequestedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "mode" "NegotiationMode" NOT NULL DEFAULT 'AI_AI',
  ADD COLUMN IF NOT EXISTS "turnCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "market_purchases"
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveryNote" TEXT,
  ADD COLUMN IF NOT EXISTS "sellerId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_DELIVERY';

-- AlterTable
ALTER TABLE "repositories"
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "service_listings"
  ALTER COLUMN "updatedAt" DROP DEFAULT,
  ALTER COLUMN "skills" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "agentEndpoint" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    CONSTRAINT "order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_certifications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "certId" TEXT NOT NULL,
    "credentialUrl" TEXT,
    "issueDate" TEXT,
    "expiryDate" TEXT,
    CONSTRAINT "user_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_messages_orderId_createdAt_idx" ON "order_messages"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_certifications_userId_idx" ON "user_certifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_certifications_userId_certId_key" ON "user_certifications"("userId", "certId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "market_purchases_sellerId_status_idx" ON "market_purchases"("sellerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "repo_collaborators_repositoryId_userId_key" ON "repo_collaborators"("repositoryId", "userId") WHERE "userId" IS NOT NULL;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "market_purchases" ADD CONSTRAINT "market_purchases_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "market_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "user_certifications" ADD CONSTRAINT "user_certifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
