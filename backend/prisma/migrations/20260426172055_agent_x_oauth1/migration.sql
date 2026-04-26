-- Per-listing OAuth 1.0a credentials. X Free tier rejects POST /2/tweets
-- over OAuth 2.0 (HTTP 402 "no credits"), but the 1.0a path still works
-- for many accounts. All four columns are nullable + additive — safe to
-- apply in-place against prod, no backfill needed.
ALTER TABLE "agent_x_connections"
  ADD COLUMN IF NOT EXISTS "oauth1ConsumerKeyEnc"        TEXT;
ALTER TABLE "agent_x_connections"
  ADD COLUMN IF NOT EXISTS "oauth1ConsumerSecretEnc"     TEXT;
ALTER TABLE "agent_x_connections"
  ADD COLUMN IF NOT EXISTS "oauth1AccessTokenEnc"        TEXT;
ALTER TABLE "agent_x_connections"
  ADD COLUMN IF NOT EXISTS "oauth1AccessTokenSecretEnc"  TEXT;
