-- CreateEnum
CREATE TYPE "OutcomeStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "RecommendationLog" ADD COLUMN     "outcomeStatus" "OutcomeStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SignalProfile" ADD COLUMN     "normalizedBurnRate" DOUBLE PRECISION,
ADD COLUMN     "normalizedCpaSlope" DOUBLE PRECISION,
ADD COLUMN     "normalizedCtrSlope" DOUBLE PRECISION,
ADD COLUMN     "normalizedImpressionDecay" DOUBLE PRECISION,
ADD COLUMN     "normalizedVolatility" DOUBLE PRECISION;
