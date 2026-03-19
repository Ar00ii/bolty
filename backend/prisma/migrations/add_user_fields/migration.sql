-- Add missing columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "occupation" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "userTag" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_userTag_key" ON "users"("userTag");
