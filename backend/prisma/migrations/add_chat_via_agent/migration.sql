-- Track when a chat message was posted "on behalf of" one of the user's
-- AI_AGENT marketplace listings, so the feed can render a via-agent chip.
ALTER TABLE "chat_messages"
  ADD COLUMN "viaAgentListingId" TEXT,
  ADD COLUMN "viaAgentName"      TEXT;
