-- Add missing columns to users table
ALTER TABLE "users" ADD COLUMN "gender" TEXT;
ALTER TABLE "users" ADD COLUMN "occupation" TEXT;
ALTER TABLE "users" ADD COLUMN "displayName" TEXT;
ALTER TABLE "users" ADD COLUMN "userTag" TEXT UNIQUE;
