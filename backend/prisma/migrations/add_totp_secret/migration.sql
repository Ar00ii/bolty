-- Add TOTP secret field for Authenticator 2FA
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
