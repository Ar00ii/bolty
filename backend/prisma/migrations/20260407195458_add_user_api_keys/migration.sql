-- CreateTable
CREATE TABLE IF NOT EXISTS "user_api_keys" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keyHash" TEXT NOT NULL,
    "label" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_api_keys_keyHash_key" ON "user_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "user_api_keys_userId_idx" ON "user_api_keys"("userId");

-- AddForeignKey
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
