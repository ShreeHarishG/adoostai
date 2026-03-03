-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "adType" TEXT,
    "metrics" TEXT NOT NULL,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalBudget" DOUBLE PRECISION,
    "decisionCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fatigueScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "severityLevel" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "analysisOutput" TEXT NOT NULL,
    "fatigueOutput" TEXT NOT NULL,
    "learningOutput" TEXT NOT NULL,
    "decisionOutput" TEXT NOT NULL,
    "recommendationOutput" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionHistory" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ctr" DOUBLE PRECISION NOT NULL,
    "cpa" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "clicks" INTEGER NOT NULL,
    "conversions" INTEGER NOT NULL,

    CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalProfile" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "ctrSlope" DOUBLE PRECISION NOT NULL,
    "cpaAcceleration" DOUBLE PRECISION NOT NULL,
    "impressionDecayRate" DOUBLE PRECISION NOT NULL,
    "spendEfficiencySlope" DOUBLE PRECISION NOT NULL,
    "engagementVolatility" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDebate" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "analystHypotheses" JSONB NOT NULL,
    "criticChallenge" JSONB NOT NULL,
    "memoryRetrieval" JSONB NOT NULL,
    "synthesizerDecision" JSONB NOT NULL,
    "debateLog" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentDebate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "recommendedContent" TEXT NOT NULL,
    "explainabilityReasoning" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acceptRate" DOUBLE PRECISION NOT NULL,
    "rejectRate" DOUBLE PRECISION NOT NULL,
    "overrideCount" INTEGER NOT NULL,
    "disagreementSuccessRate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "predictedSpendExhaustionDate" TIMESTAMP(3),
    "projectedBurnRate" DOUBLE PRECISION,
    "statisticalConfidenceRisk" TEXT NOT NULL,
    "budgetRiskLevel" TEXT NOT NULL,
    "modelConfidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE INDEX "AnalysisRun_campaignId_idx" ON "AnalysisRun"("campaignId");

-- CreateIndex
CREATE INDEX "WorkflowLog_campaignId_idx" ON "WorkflowLog"("campaignId");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_campaignId_idx" ON "PerformanceSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_timestamp_idx" ON "PerformanceSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "SignalProfile_campaignId_idx" ON "SignalProfile"("campaignId");

-- CreateIndex
CREATE INDEX "SignalProfile_computedAt_idx" ON "SignalProfile"("computedAt");

-- CreateIndex
CREATE INDEX "AgentDebate_campaignId_idx" ON "AgentDebate"("campaignId");

-- CreateIndex
CREATE INDEX "AgentDebate_completedAt_idx" ON "AgentDebate"("completedAt");

-- CreateIndex
CREATE INDEX "RecommendationLog_campaignId_idx" ON "RecommendationLog"("campaignId");

-- CreateIndex
CREATE INDEX "RecommendationLog_createdAt_idx" ON "RecommendationLog"("createdAt");

-- CreateIndex
CREATE INDEX "CollaborationProfile_userId_idx" ON "CollaborationProfile"("userId");

-- CreateIndex
CREATE INDEX "ForecastLog_campaignId_idx" ON "ForecastLog"("campaignId");

-- CreateIndex
CREATE INDEX "ForecastLog_createdAt_idx" ON "ForecastLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionHistory" ADD CONSTRAINT "DecisionHistory_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowLog" ADD CONSTRAINT "WorkflowLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalProfile" ADD CONSTRAINT "SignalProfile_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentDebate" ADD CONSTRAINT "AgentDebate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationLog" ADD CONSTRAINT "RecommendationLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationProfile" ADD CONSTRAINT "CollaborationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastLog" ADD CONSTRAINT "ForecastLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
