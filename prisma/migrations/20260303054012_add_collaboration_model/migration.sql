/*
  Warnings:

  - You are about to drop the column `overrideCount` on the `CollaborationProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `CollaborationProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CollaborationProfile" DROP COLUMN "overrideCount",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "overrideRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "riskToleranceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "verbosityPreference" TEXT NOT NULL DEFAULT 'DETAILED',
ALTER COLUMN "acceptRate" SET DEFAULT 0,
ALTER COLUMN "rejectRate" SET DEFAULT 0,
ALTER COLUMN "disagreementSuccessRate" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "RecommendationLog" ADD COLUMN     "outcomeScore" DOUBLE PRECISION,
ADD COLUMN     "scoringCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userResponse" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationProfile_userId_key" ON "CollaborationProfile"("userId");
