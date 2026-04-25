-- BoltyGuard: security_scans table + ScanSeverity enum.

CREATE TYPE "ScanSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

CREATE TABLE "security_scans" (
    "id"            TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId"     TEXT NOT NULL,
    "score"         INTEGER NOT NULL,
    "worstSeverity" "ScanSeverity",
    "findings"      JSONB NOT NULL,
    "scanner"       TEXT NOT NULL DEFAULT 'claude',
    "fileKey"       TEXT,
    "summary"       TEXT,

    CONSTRAINT "security_scans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "security_scans_listingId_createdAt_idx"
    ON "security_scans"("listingId", "createdAt");

ALTER TABLE "security_scans"
    ADD CONSTRAINT "security_scans_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "market_listings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
