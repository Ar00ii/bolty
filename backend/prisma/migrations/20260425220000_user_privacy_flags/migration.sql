-- Friends-tab privacy toggles. Both default to true so existing users
-- keep the same behaviour they had before the migration: friend requests
-- are accepted, and public messages from non-friends are allowed.
ALTER TABLE "users"
  ADD COLUMN "friendRequestsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "publicMessagesEnabled" BOOLEAN NOT NULL DEFAULT true;
