-- CreateTable
CREATE TABLE "CreativeSuggestion" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "primaryCause" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidenceImpact" DOUBLE PRECISION NOT NULL,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreativeSuggestion_campaignId_idx" ON "CreativeSuggestion"("campaignId");

-- AddForeignKey
ALTER TABLE "CreativeSuggestion" ADD CONSTRAINT "CreativeSuggestion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
