-- AlterTable
ALTER TABLE "PerformanceSnapshot" ALTER COLUMN "sourceType" DROP DEFAULT,
ALTER COLUMN "date" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PlatformStats" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "campaignsMonitored" INTEGER NOT NULL DEFAULT 0,
    "spendProtected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creativeRefreshes" INTEGER NOT NULL DEFAULT 0,
    "totalAnalysesCompleted" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformStats_pkey" PRIMARY KEY ("id")
);
