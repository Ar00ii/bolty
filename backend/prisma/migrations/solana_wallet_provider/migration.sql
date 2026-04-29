-- Migrate WalletProvider enum from EVM (METAMASK/WALLETCONNECT/RAINBOW/UNISWAP)
-- to Solana (PHANTOM/SOLFLARE/BACKPACK/GLOW). COINBASE + OTHER kept.
-- Existing rows with deprecated values get mapped to OTHER so no data is lost.

ALTER TYPE "WalletProvider" RENAME TO "WalletProvider_old";

CREATE TYPE "WalletProvider" AS ENUM ('PHANTOM', 'SOLFLARE', 'BACKPACK', 'GLOW', 'COINBASE', 'OTHER');

ALTER TABLE "user_wallets" ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "user_wallets"
  ALTER COLUMN "provider" TYPE "WalletProvider"
  USING (
    CASE "provider"::text
      WHEN 'COINBASE' THEN 'COINBASE'::"WalletProvider"
      ELSE 'OTHER'::"WalletProvider"
    END
  );
ALTER TABLE "user_wallets" ALTER COLUMN "provider" SET DEFAULT 'OTHER';

DROP TYPE "WalletProvider_old";
