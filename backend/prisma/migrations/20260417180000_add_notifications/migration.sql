-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'MARKET_NEW_SALE',
  'MARKET_NEW_REVIEW',
  'MARKET_ORDER_DELIVERED',
  'MARKET_ORDER_COMPLETED',
  'MARKET_NEGOTIATION_MESSAGE',
  'SYSTEM'
);

-- CreateTable
CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "url" TEXT,
  "meta" JSONB,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
