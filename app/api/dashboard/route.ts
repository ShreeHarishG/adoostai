import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getSessionUser()

        // Fetch all campaigns with their latest analysis run and decision history
        const campaigns = await prisma.campaign.findMany({
            where: { userId: user.id },
            include: {
                analysisRuns: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                 decisions: {
                    orderBy: { createdAt: 'desc' }
                },
                forecastLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        // Compute aggregate stats
        const totalCampaigns = campaigns.length
        const totalAnalyses = await prisma.analysisRun.count({
            where: {
                campaign: { userId: user.id }
            }
        })

        // Compute stats from latest runs only
        const campaignsWithRuns = campaigns.filter(c => c.analysisRuns.length > 0)
        const latestScores = campaignsWithRuns.map(c => c.analysisRuns[0].fatigueScore)

        const avgFatigue = latestScores.length > 0
            ? latestScores.reduce((sum, s) => sum + s, 0) / latestScores.length
            : 0

        const severeCampaigns = campaignsWithRuns.filter(
            c => c.analysisRuns[0].severityLevel === 'CRITICAL' || c.analysisRuns[0].severityLevel === 'HIGH'
        ).length

        const severityPercent = totalCampaigns > 0
            ? (severeCampaigns / totalCampaigns) * 100
            : 0

        // Calculate user override rate from decision history
        const allDecisions = campaigns.flatMap(c => c.decisions)
        const totalDecisions = allDecisions.length
        const overrideCount = allDecisions.filter(d =>
            d.actionTaken === 'pause_ad'
        ).length
        const overrideRate = totalDecisions > 0
            ? (overrideCount / totalDecisions) * 100
            : 0

        // Calculate estimated spend protected from fatigue waste
        let estimatedSpendProtected = 0
        for (const c of campaignsWithRuns) {
            const latestRun = c.analysisRuns[0]
            if (latestRun.severityLevel === 'CRITICAL' || latestRun.severityLevel === 'HIGH') {
                const burnRate = c.forecastLogs?.[0]?.projectedBurnRate || 0
                const msSinceDetection = Date.now() - new Date(latestRun.createdAt).getTime()
                const daysSinceDetection = Math.max(1, msSinceDetection / (1000 * 60 * 60 * 24))
                estimatedSpendProtected += burnRate * daysSinceDetection
            }
        }

        // Build campaign table rows
        const campaignRows = campaigns.map(c => {
            const latestRun = c.analysisRuns?.[0] ?? null
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { analysisRuns, decisions, ...campaignData } = c
            return {
                ...campaignData,
                latestRun: latestRun ? {
                    id: latestRun.id,
                    fatigueScore: latestRun.fatigueScore,
                    confidenceScore: latestRun.confidenceScore,
                    severityLevel: latestRun.severityLevel,
                    suggestedAction: latestRun.suggestedAction,
                    createdAt: latestRun.createdAt,
                } : null,
                totalDecisions: decisions.length,
                lastDecision: decisions[0]?.actionTaken ?? null,
            }
        })

        return NextResponse.json({
            stats: {
                totalCampaigns,
                totalAnalyses,
                avgFatigue: Math.round(avgFatigue * 10) / 10,
                severeCampaigns,
                severityPercent: Math.round(severityPercent),
                overrideRate: Math.round(overrideRate),
                campaignsWithRuns: campaignsWithRuns.length,
                estimatedSpendProtected: Math.round(estimatedSpendProtected),
            },
            campaigns: campaignRows
        })

    } catch (error) {
        console.error('Error fetching dashboard:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
    }
}
