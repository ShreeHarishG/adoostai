/**
 * Memory Agent – Phase 4 (Structured Similarity)
 *
 * Uses the memory engine to find similar past campaigns
 * and adjusts confidence based on their outcomes.
 *
 * Rules:
 *   - Past outcome SUCCESS with same diagnosis → +5% confidence
 *   - Past outcome FAILED (misdiagnosis) → −5% confidence
 *   - PENDING/UNKNOWN or no matches → neutral 0%
 *   - Cold start (< 10 profiles) → the engine returns empty, so neutral
 */

import { MemoryContext, SimilarCampaign } from './types'

export function memoryAgent(
    topHypothesisCause: string,
    similarCampaigns: SimilarCampaign[],
): MemoryContext {
    if (similarCampaigns.length === 0) {
        return {
            similarPatternCount: 0,
            confidenceAdjustment: 0,
            matchedIssues: [],
            similarCampaigns: [],
        }
    }

    // Check outcomes of similar campaigns
    let successCount = 0
    let failedCount = 0
    const matchedIssues: string[] = []

    for (const sc of similarCampaigns) {
        matchedIssues.push(sc.finalDecision)

        if (sc.outcomeStatus === 'SUCCESS') {
            successCount++
        } else if (sc.outcomeStatus === 'FAILED') {
            failedCount++
        }
        // PENDING and UNKNOWN are neutral — no adjustment
    }

    // Confidence adjustment logic
    let confidenceAdjustment = 0
    if (successCount > failedCount) {
        confidenceAdjustment = 0.05  // Past success reinforces current hypothesis
    } else if (failedCount > successCount) {
        confidenceAdjustment = -0.05 // Past failure suggests misdiagnosis risk
    }

    return {
        similarPatternCount: similarCampaigns.length,
        confidenceAdjustment,
        matchedIssues: [...new Set(matchedIssues)],
        similarCampaigns,
    }
}
