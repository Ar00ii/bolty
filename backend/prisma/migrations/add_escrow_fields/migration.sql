-- Add escrow support to market_purchases

-- Create the EscrowStatus enum
CREATE TYPE "EscrowStatus" AS ENUM ('NONE', 'FUNDED', 'RELEASED', 'DISPUTED', 'RESOLVED', 'REFUNDED');

-- Add escrow columns to market_purchases
ALTER TABLE "market_purchases" ADD COLUMN "escrowContract" TEXT;
ALTER TABLE "market_purchases" ADD COLUMN "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "market_purchases" ADD COLUMN "escrowReleaseTx" TEXT;
ALTER TABLE "market_purchases" ADD COLUMN "escrowDisputedAt" TIMESTAMP(3);
ALTER TABLE "market_purchases" ADD COLUMN "escrowResolvedAt" TIMESTAMP(3);
