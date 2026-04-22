-- Buyer can pick which of their own agents negotiates on their behalf.
-- The picked agent's agentEndpoint (or sandbox file) overrides the
-- fallback on User.agentEndpoint during the AI-vs-AI loop.
ALTER TABLE "agent_negotiations"
  ADD COLUMN IF NOT EXISTS "buyerAgentListingId" TEXT;
