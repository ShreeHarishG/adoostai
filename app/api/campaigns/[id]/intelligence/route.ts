import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionUser()
        const { id } = await params

        // Fetch campaign with ALL analysis runs (for trend), workflow logs, and decisions
        const campaign = await prisma.campaign.findUnique({
            where: {
                id,
                userId: user.id
            },
            include: {
                analysisRuns: {
                    orderBy: { createdAt: 'asc' } // Chronological for charting
                },
                performanceSnapshots: {
                    orderBy: { createdAt: 'asc' }
                },
                workflowLogs: {
                    orderBy: { createdAt: 'asc' }
                },
                decisions: {
                    orderBy: { createdAt: 'asc' }
                },
                forecastLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                agentDebates: {
                    orderBy: { completedAt: 'desc' },
                    take: 1,
                },
                recommendationLogs: {
                    where: { status: 'PENDING' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                creativeSuggestions: {
                    orderBy: { createdAt: 'desc' },
                },
                importedContent: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Fetch collaboration profile for this user
        const collaborationProfile = await prisma.collaborationProfile.findUnique({
            where: { userId: user.id },
        })

        // --- Fatigue Trend Data ---
        const fatigueTrend = campaign.analysisRuns.map((run, index) => ({
            runIndex: index + 1,
            fatigueScore: run.fatigueScore,
            confidenceScore: run.confidenceScore,
            severityLevel: run.severityLevel,
            suggestedAction: run.suggestedAction,
            timestamp: run.createdAt,
        }))

        // --- Snapshot Series for charts ---
        const snapshotSeries = campaign.performanceSnapshots.map(s => {
            // Support both legacy and new schema fields during migration
            const snapshotDate = (s as unknown as { date?: Date; timestamp?: Date }).date
                ?? (s as unknown as { date?: Date; timestamp?: Date }).timestamp
                ?? s.createdAt
            const ctr = s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0
            return {
                date: snapshotDate,
                impressions: s.impressions,
                clicks: s.clicks,
                spend: s.spend,
                conversions: s.conversions,
                ctr,
                reach: s.reach,
                frequency: s.frequency,
            }
        })

        // Detect rising fatigue trend (3+ consecutive increases)
        let risingStreak = 0
        for (let i = 1; i < fatigueTrend.length; i++) {
            if (fatigueTrend[i].fatigueScore > fatigueTrend[i - 1].fatigueScore) {
                risingStreak++
            } else {
                risingStreak = 0
            }
        }
        const hasFatigueAcceleration = risingStreak >= 2 && fatigueTrend.length >= 3

        // --- Agent Execution Timeline ---
        const agentTimeline = campaign.workflowLogs.map(log => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let parsed: Record<string, any> = {}
            try {
                parsed = log.payload ? JSON.parse(log.payload) : {}
            } catch { /* ignore parse errors */ }

            return {
                step: log.step,
                timestamp: log.createdAt,
                payload: parsed,
            }
        })

        // --- Learning Bias Analysis ---
        const allDecisions = campaign.decisions
        const totalDecisions = allDecisions.length

        const pauseDecisions = allDecisions.filter(d => d.actionTaken === 'pause_ad')
        const refreshDecisions = allDecisions.filter(d => d.actionTaken === 'refresh_creative')

        // Find runs that have corresponding decisions
        const runsWithActions = campaign.analysisRuns.map(run => {
            const suggestedAction = run.suggestedAction
            return {
                fatigueScore: run.fatigueScore,
                suggestedAction,
                createdAt: run.createdAt,
            }
        })

        // Calculate average fatigue at pause vs continue
        // We pair decisions with the closest preceding analysis run
        let avgFatigueAtPause = 0
        let avgFatigueAtContinue = 0
        let pauseWithFatigue = 0
        let continueWithFatigue = 0

        for (const decision of allDecisions) {
            // Find the latest run before this decision
            const precedingRun = campaign.analysisRuns
                .filter(r => new Date(r.createdAt) <= new Date(decision.createdAt))
                .pop()

            if (precedingRun) {
                if (decision.actionTaken === 'pause_ad') {
                    avgFatigueAtPause += precedingRun.fatigueScore
                    pauseWithFatigue++
                } else {
                    avgFatigueAtContinue += precedingRun.fatigueScore
                    continueWithFatigue++
                }
            }
        }

        avgFatigueAtPause = pauseWithFatigue > 0 ? Math.round(avgFatigueAtPause / pauseWithFatigue) : 0
        avgFatigueAtContinue = continueWithFatigue > 0 ? Math.round(avgFatigueAtContinue / continueWithFatigue) : 0

        // --- Decision Consistency ---
        // Compare system suggestion vs user action
        let overrideCount = 0
        let alignedCount = 0

        for (const decision of allDecisions) {
            const precedingRun = campaign.analysisRuns
                .filter(r => new Date(r.createdAt) <= new Date(decision.createdAt))
                .pop()

            if (precedingRun) {
                const systemAction = precedingRun.suggestedAction
                const userAction = decision.actionTaken

                // Map user actions to system action names for comparison
                const isAligned =
                    (systemAction === 'PAUSE' && userAction === 'pause_ad') ||
                    (systemAction === 'REFRESH' && userAction === 'refresh_creative') ||
                    (systemAction === 'TEST' && userAction === 'refresh_creative') ||
                    (systemAction === 'CONTINUE' && userAction === 'refresh_creative')

                if (isAligned) alignedCount++
                else overrideCount++
            }
        }

        const consistencyScore = totalDecisions > 0
            ? Math.round((alignedCount / totalDecisions) * 100)
            : 100 // No decisions = no disagreements

        // System recommendations vs user choices
        const systemPauseCount = campaign.analysisRuns.filter(r => r.suggestedAction === 'PAUSE').length
        const userIgnoredPause = campaign.analysisRuns.filter(r => {
            if (r.suggestedAction !== 'PAUSE') return false
            // Check if user took a different action after this run
            const followingDecision = allDecisions.find(
                d => new Date(d.createdAt) >= new Date(r.createdAt)
            )
            return followingDecision && followingDecision.actionTaken !== 'pause_ad'
        }).length

        return NextResponse.json({
            campaign: {
                id: campaign.id,
                platform: campaign.platform,
                adType: campaign.adType,
                status: campaign.status,
                createdAt: campaign.createdAt,
                updatedAt: campaign.updatedAt,
            },
            fatigueTrend,
            snapshotSeries,
            hasFatigueAcceleration,
            agentTimeline,
            learningBias: {
                totalDecisions,
                pauseCount: pauseDecisions.length,
                refreshCount: refreshDecisions.length,
                avgFatigueAtPause,
                avgFatigueAtContinue,
                overrideRate: totalDecisions > 0 ? Math.round((pauseDecisions.length / totalDecisions) * 100) : 0,
                systemPauseCount,
                userIgnoredPause,
            },
            decisionConsistency: {
                score: consistencyScore,
                totalDecisions,
                alignedCount,
                overrideCount,
            },
            latestRun: campaign.analysisRuns.at(-1) ?? null,
            latestForecast: campaign.forecastLogs[0] ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            similarCampaigns: (campaign.agentDebates[0]?.memoryRetrieval as any)?.similarCampaigns ?? [],
            creativeContent: campaign.importedContent[0] ? {
                id: campaign.importedContent[0].id,
                caption: campaign.importedContent[0].caption,
                hashtags: campaign.importedContent[0].hashtags,
                mediaType: campaign.importedContent[0].mediaType,
                thumbnailUrl: campaign.importedContent[0].thumbnailUrl,
                createdAt: campaign.importedContent[0].createdAt,
            } : null,
            collaborationProfile: collaborationProfile ? {
                riskToleranceScore: collaborationProfile.riskToleranceScore,
                disagreementSuccessRate: collaborationProfile.disagreementSuccessRate,
                acceptRate: collaborationProfile.acceptRate,
                rejectRate: collaborationProfile.rejectRate,
                overrideRate: collaborationProfile.overrideRate,
                verbosityPreference: collaborationProfile.verbosityPreference,
            } : null,
            latestRecommendation: campaign.recommendationLogs[0] ? {
                id: campaign.recommendationLogs[0].id,
                interventionType: campaign.recommendationLogs[0].interventionType,
                recommendedContent: campaign.recommendationLogs[0].recommendedContent,
                status: campaign.recommendationLogs[0].status,
                userResponse: campaign.recommendationLogs[0].userResponse,
            } : null,
        })

    } catch (error) {
        console.error('Error fetching campaign intelligence:', error)
        return NextResponse.json({ error: 'Failed to fetch intelligence' }, { status: 500 })
    }
}
