-- Additional performance indexes

CREATE INDEX IF NOT EXISTS "users_isBanned_idx" ON "users"("isBanned");
CREATE INDEX IF NOT EXISTS "friendships_status_idx" ON "friendships"("status");
