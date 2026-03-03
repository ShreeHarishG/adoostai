/**
 * Memory Engine – Structured Similarity Search
 *
 * Finds similar past campaigns using weighted Manhattan distance
 * on Min-Max normalized signal fingerprints.
 *
 * Cold Start: if < 10 SignalProfiles exist, returns empty (no matching).
 */

import { prisma } from '@/lib/prisma'

// ─── Types ──────────────────────────────────────────────

export interface SimilarCampaign {
    campaignId: string
    similarityScore: number   // 0 = identical, higher = more different
    finalDecision: string     // last suggested action
    outcomeStatus: string     // PENDING | SUCCESS | FAILED | UNKNOWN
}

interface NormalizedFingerprint {
    campaignId: string
    normalizedCtrSlope: number
    normalizedCpaSlope: number
    normalizedImpressionDecay: number
    normalizedBurnRate: number
    normalizedVolatility: number
}

// ─── Distance Math ──────────────────────────────────────

/**
 * Weighted Manhattan distance between two normalized fingerprints.
 * Weights sum to 1.0.
 */
function computeManhattanDistance(
    a: NormalizedFingerprint,
    b: NormalizedFingerprint,
): number {
    return (
        Math.abs(a.normalizedCtrSlope - b.normalizedCtrSlope) * 0.25 +
        Math.abs(a.normalizedCpaSlope - b.normalizedCpaSlope) * 0.25 +
        Math.abs(a.normalizedImpressionDecay - b.normalizedImpressionDecay) * 0.20 +
        Math.abs(a.normalizedBurnRate - b.normalizedBurnRate) * 0.15 +
        Math.abs(a.normalizedVolatility - b.normalizedVolatility) * 0.15
    )
}

// ─── Pure Matching (no DB) ──────────────────────────────

/**
 * Pure function: given a current fingerprint and historical fingerprints,
 * returns the top 3 most similar campaigns.
 */
export function matchSimilarCampaigns(
    current: NormalizedFingerprint,
    history: (NormalizedFingerprint & { finalDecision: string; outcomeStatus: string })[],
): SimilarCampaign[] {
    const scored = history.map(h => ({
        campaignId: h.campaignId,
        similarityScore: computeManhattanDistance(current, h),
        finalDecision: h.finalDecision,
        outcomeStatus: h.outcomeStatus,
    }))

    // Lower score = more similar. Sort ascending.
    scored.sort((a, b) => a.similarityScore - b.similarityScore)

    return scored.slice(0, 3)
}

// ─── DB-Backed Search ───────────────────────────────────

const COLD_START_THRESHOLD = 10

/**
 * Finds the top 3 similar campaigns from the database.
 * Returns empty array if cold start threshold not met (< 10 profiles).
 */
export async function findSimilarCampaigns(
    currentCampaignId: string,
    currentSignals: {
        normalizedCtrSlope: number
        normalizedCpaSlope: number
        normalizedImpressionDecay: number
        normalizedBurnRate: number
        normalizedVolatility: number
    },
): Promise<SimilarCampaign[]> {
    // Cold Start Guard
    const totalProfiles = await prisma.signalProfile.count()
    if (totalProfiles < COLD_START_THRESHOLD) {
        return []
    }

    // Fetch last 20 normalized profiles (excluding current campaign)
    const profiles = await prisma.signalProfile.findMany({
        where: {
            campaignId: { not: currentCampaignId },
            normalizedCtrSlope: { not: null },
        },
        orderBy: { computedAt: 'desc' },
        take: 20,
        select: {
            campaignId: true,
            normalizedCtrSlope: true,
            normalizedCpaSlope: true,
            normalizedImpressionDecay: true,
            normalizedBurnRate: true,
            normalizedVolatility: true,
        },
    })

    // Deduplicate by campaignId (take most recent per campaign)
    const seen = new Set<string>()
    const uniqueProfiles = profiles.filter(p => {
        if (seen.has(p.campaignId)) return false
        seen.add(p.campaignId)
        return true
    })

    // Fetch the latest RecommendationLog for each campaign to get decision + outcome
    const campaignIds = uniqueProfiles.map(p => p.campaignId)
    const recommendations = await prisma.recommendationLog.findMany({
        where: { campaignId: { in: campaignIds } },
        orderBy: { createdAt: 'desc' },
        select: {
            campaignId: true,
            interventionType: true,
            outcomeStatus: true,
        },
    })

    // Map campaignId → latest recommendation
    const recMap = new Map<string, { finalDecision: string; outcomeStatus: string }>()
    for (const rec of recommendations) {
        if (!recMap.has(rec.campaignId)) {
            recMap.set(rec.campaignId, {
                finalDecision: rec.interventionType,
                outcomeStatus: rec.outcomeStatus,
            })
        }
    }

    // Build history with decisions
    const history = uniqueProfiles
        .filter(p =>
            p.normalizedCtrSlope != null &&
            p.normalizedCpaSlope != null &&
            p.normalizedImpressionDecay != null &&
            p.normalizedBurnRate != null &&
            p.normalizedVolatility != null,
        )
        .map(p => {
            const rec = recMap.get(p.campaignId)
            return {
                campaignId: p.campaignId,
                normalizedCtrSlope: p.normalizedCtrSlope!,
                normalizedCpaSlope: p.normalizedCpaSlope!,
                normalizedImpressionDecay: p.normalizedImpressionDecay!,
                normalizedBurnRate: p.normalizedBurnRate!,
                normalizedVolatility: p.normalizedVolatility!,
                finalDecision: rec?.finalDecision ?? 'UNKNOWN',
                outcomeStatus: rec?.outcomeStatus ?? 'UNKNOWN',
            }
        })

    const current: NormalizedFingerprint = {
        campaignId: currentCampaignId,
        ...currentSignals,
    }

    return matchSimilarCampaigns(current, history)
}
