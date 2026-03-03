/**
 * Collaboration Engine – Behavioral Adaptation
 *
 * Analyzes user decision patterns from RecommendationLog
 * and updates CollaborationProfile.
 *
 * Key Rules:
 *   - acceptRate/rejectRate/overrideRate computed from last 20 decisions
 *   - riskToleranceScore: high if user frequently rejects PAUSE recommendations
 *   - disagreementSuccessRate: only scored on decisions ≥ 3 days old with scoringCompleted=true
 *   - verbosityPreference: CONCISE if rejectRate > 0.6
 */

import { prisma } from '@/lib/prisma'

const LATENCY_DAYS = 3
const HISTORY_LIMIT = 20

/**
 * Recalculate and upsert the user's CollaborationProfile.
 */
export async function updateCollaborationProfile(userId: string): Promise<void> {
    // Fetch last 20 recommendations that have a userResponse (decided)
    const decisions = await prisma.recommendationLog.findMany({
        where: {
            campaign: { userId },
            userResponse: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
        select: {
            userResponse: true,
            interventionType: true,
            outcomeScore: true,
            scoringCompleted: true,
            createdAt: true,
        },
    })

    if (decisions.length === 0) {
        // No decisions yet — keep defaults
        return
    }

    const total = decisions.length

    // ─── Rate Calculations ──────────────────────────────
    const acceptCount = decisions.filter(d => d.userResponse === 'ACCEPTED').length
    const rejectCount = decisions.filter(d => d.userResponse === 'REJECTED').length
    const modifyCount = decisions.filter(d => d.userResponse === 'MODIFIED').length

    const acceptRate = acceptCount / total
    const rejectRate = rejectCount / total
    const overrideRate = modifyCount / total

    // ─── Risk Tolerance ─────────────────────────────────
    // High if user frequently rejects PAUSE recommendations
    const pauseRecommendations = decisions.filter(d => d.interventionType === 'PAUSE')
    const pauseRejections = pauseRecommendations.filter(d => d.userResponse !== 'ACCEPTED').length
    const riskToleranceScore = pauseRecommendations.length > 0
        ? pauseRejections / pauseRecommendations.length
        : 0.5 // neutral if no PAUSE recs

    // ─── Disagreement Success Rate (Latency-Aware) ──────
    const latencyCutoff = new Date(Date.now() - LATENCY_DAYS * 24 * 60 * 60 * 1000)
    const scoredDisagreements = decisions.filter(d =>
        d.userResponse !== 'ACCEPTED' &&
        d.scoringCompleted === true &&
        d.createdAt < latencyCutoff,
    )

    let disagreementSuccessRate = 0
    if (scoredDisagreements.length > 0) {
        const successfulOverrides = scoredDisagreements.filter(d =>
            d.outcomeScore !== null && d.outcomeScore > 0,
        ).length
        disagreementSuccessRate = successfulOverrides / scoredDisagreements.length
    }

    // ─── Verbosity Preference ───────────────────────────
    const verbosityPreference = rejectRate > 0.6 ? 'CONCISE' : 'DETAILED'

    // ─── Upsert Profile ─────────────────────────────────
    await prisma.collaborationProfile.upsert({
        where: { userId },
        create: {
            userId,
            acceptRate,
            rejectRate,
            overrideRate,
            disagreementSuccessRate,
            riskToleranceScore,
            verbosityPreference,
        },
        update: {
            acceptRate,
            rejectRate,
            overrideRate,
            disagreementSuccessRate,
            riskToleranceScore,
            verbosityPreference,
        },
    })

    console.log(`[Collaboration] Profile updated for user ${userId}: accept=${(acceptRate * 100).toFixed(0)}%, risk=${riskToleranceScore.toFixed(2)}, verbosity=${verbosityPreference}`)
}
