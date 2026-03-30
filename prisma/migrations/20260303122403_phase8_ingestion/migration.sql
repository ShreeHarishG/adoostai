-- Phase 8 ingestion schema updates

ALTER TABLE "PerformanceSnapshot"
  DROP COLUMN IF EXISTS "timestamp",
  DROP COLUMN IF EXISTS "ctr",
  DROP COLUMN IF EXISTS "cpa";

ALTER TABLE "PerformanceSnapshot"
  ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "sourceReference" TEXT,
  ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3) NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "reach" INTEGER,
  ADD COLUMN IF NOT EXISTS "frequency" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Ensure required fields exist (in case of legacy schema)
ALTER TABLE "PerformanceSnapshot"
  ALTER COLUMN "impressions" SET NOT NULL,
  ALTER COLUMN "clicks" SET NOT NULL,
  ALTER COLUMN "spend" SET NOT NULL,
  ALTER COLUMN "conversions" SET NOT NULL;

DROP INDEX IF EXISTS "PerformanceSnapshot_timestamp_idx";
CREATE INDEX IF NOT EXISTS "PerformanceSnapshot_date_idx" ON "PerformanceSnapshot"("date");

CREATE TABLE IF NOT EXISTS "ImportedFile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "errorMsg" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "ImportedFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ImportedFile_userId_idx" ON "ImportedFile"("userId");
CREATE INDEX IF NOT EXISTS "ImportedFile_createdAt_idx" ON "ImportedFile"("createdAt");

ALTER TABLE "ImportedFile"
  ADD CONSTRAINT "ImportedFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ImportedContent" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceReference" TEXT,
  "caption" TEXT NOT NULL,
  "hashtags" JSONB NOT NULL,
  "mediaType" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "ImportedContent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ImportedContent_campaignId_idx" ON "ImportedContent"("campaignId");
CREATE INDEX IF NOT EXISTS "ImportedContent_createdAt_idx" ON "ImportedContent"("createdAt");

ALTER TABLE "ImportedContent"
  ADD CONSTRAINT "ImportedContent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
