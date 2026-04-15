-- Create Rays Packs enum
CREATE TYPE "RaysPack" AS ENUM ('PACK_10', 'PACK_25', 'PACK_50', 'PACK_120', 'PACK_250');

-- Create Purchase Status enum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Create Agent Rank enum
CREATE TYPE "AgentRank" AS ENUM ('HIERRO', 'BRONCE', 'PLATA', 'ORO', 'PLATINO', 'DIAMANTE', 'MAESTRIA', 'CAMPEON');

-- Create rays_purchases table
CREATE TABLE "rays_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "raysPack" "RaysPack" NOT NULL,
    "raysAmount" INTEGER NOT NULL,
    "boltyAmount" DECIMAL(18,2) NOT NULL,
    "txHash" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    CONSTRAINT "rays_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "rays_purchases_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE CASCADE
);

-- Create agent_rays table
CREATE TABLE "agent_rays" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL UNIQUE,
    "totalRaysAccumulated" INTEGER NOT NULL DEFAULT 0,
    "currentRank" "AgentRank" NOT NULL DEFAULT 'HIERRO',
    "lastRankUpAt" TIMESTAMP(3),
    CONSTRAINT "agent_rays_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE CASCADE
);

-- Create rank_history table
CREATE TABLE "rank_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentRaysId" TEXT NOT NULL,
    "previousRank" "AgentRank" NOT NULL,
    "newRank" "AgentRank" NOT NULL,
    "totalRaysAt" INTEGER NOT NULL,
    CONSTRAINT "rank_history_agentRaysId_fkey" FOREIGN KEY ("agentRaysId") REFERENCES "agent_rays" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "rays_purchases_userId_agentId_idx" ON "rays_purchases"("userId", "agentId");
CREATE INDEX "rays_purchases_createdAt_idx" ON "rays_purchases"("createdAt");
CREATE INDEX "agent_rays_totalRaysAccumulated_idx" ON "agent_rays"("totalRaysAccumulated");
CREATE INDEX "rank_history_agentRaysId_createdAt_idx" ON "rank_history"("agentRaysId", "createdAt");
