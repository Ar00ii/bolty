-- Create Agent Status enum type
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TESTING', 'ERROR');

-- Create Activity Status enum type
CREATE TYPE "ActivityStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'TIMEOUT');

-- Create agents table
CREATE TABLE "agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'INACTIVE',
    "webhookUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Create index for agents
CREATE INDEX "agents_userId_idx" ON "agents"("userId");

-- Create agent_metrics table
CREATE TABLE "agent_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "successfulCalls" INTEGER NOT NULL DEFAULT 0,
    "failedCalls" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "lastCallAt" TIMESTAMP(3),
    "agentId" TEXT NOT NULL UNIQUE,
    CONSTRAINT "agent_metrics_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE CASCADE
);

-- Create agent_activity_logs table
CREATE TABLE "agent_activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL,
    "metadata" JSONB,
    "responseTime" INTEGER,
    "agentId" TEXT NOT NULL,
    CONSTRAINT "agent_activity_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE CASCADE
);

-- Create index for agent_activity_logs
CREATE INDEX "agent_activity_logs_agentId_createdAt_idx" ON "agent_activity_logs"("agentId", "createdAt");
