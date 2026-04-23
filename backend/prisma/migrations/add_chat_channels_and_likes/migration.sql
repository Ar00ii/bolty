-- Channel-aware chat (Twitter/X-style feed) + lightweight likes.
-- Existing rows default to the "general" channel so legacy /chat keeps working.

ALTER TABLE "chat_messages"
  ADD COLUMN "channel"   TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN "imageUrl"  TEXT,
  ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "chat_messages_channel_isDeleted_createdAt_idx"
  ON "chat_messages"("channel", "isDeleted", "createdAt");

CREATE TABLE "chat_message_likes" (
  "id"        TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "messageId" TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  CONSTRAINT "chat_message_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_message_likes_messageId_userId_key"
  ON "chat_message_likes"("messageId", "userId");
CREATE INDEX "chat_message_likes_userId_idx"
  ON "chat_message_likes"("userId");

ALTER TABLE "chat_message_likes"
  ADD CONSTRAINT "chat_message_likes_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_message_likes"
  ADD CONSTRAINT "chat_message_likes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
