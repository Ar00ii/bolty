-- Add index on (isDeleted, createdAt) to speed up getRecentMessages query
-- which filters WHERE isDeleted = false ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "chat_messages_isDeleted_createdAt_idx"
  ON "chat_messages"("isDeleted", "createdAt" DESC);

-- Add composite indexes for DM conversation queries
-- getConversation uses OR [(senderId=A,receiverId=B),(senderId=B,receiverId=A)] ORDER BY createdAt
CREATE INDEX IF NOT EXISTS "direct_messages_senderId_receiverId_createdAt_idx"
  ON "direct_messages"("senderId", "receiverId", "createdAt");

CREATE INDEX IF NOT EXISTS "direct_messages_receiverId_senderId_createdAt_idx"
  ON "direct_messages"("receiverId", "senderId", "createdAt");
