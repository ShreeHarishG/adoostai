/**
 * Critic Agent – Round 2 of Structured Debate
 *
 * STRICTLY PURE. No DB access.
 * Takes the Analyst's hypotheses + context and challenges them.
 *
 * Rules:
 *   - All revised confidences are clamped to [0, 1]
 *   - Null-safe: if forecastContext is null, Budget Instability confidence → 0
 */

import { ForecastContext } from '@/types/agents'
import { Hypothesis, CriticChallenge } from './types'

const clamp = (v: number): number => Math.min(1, Math.max(0, v))

export function criticAgent(
    hypotheses: Hypothesis[],
    snapshotCount: number,
    engagementVolatility: number,
    forecastContext: ForecastContext | null,
): CriticChallenge[] {
    const challenges: CriticChallenge[] = []

    for (const h of hypotheses) {
        let revisedConfidence = h.confidence
        let challenge = 'No challenge — hypothesis accepted.'

        // ── Creative Fatigue challenges ──
        if (h.cause === 'Creative Fatigue') {
            if (snapshotCount < 5) {
                const penalty = 0.3
                revisedConfidence -= penalty
                challenge = `Data insufficient (${snapshotCount} snapshots < 5). Confidence reduced by ${penalty}.`
            }

            if (h.confidence > 0.3 && engagementVolatility > 0.6) {
                revisedConfidence -= 0.1
                challenge += ' High engagement volatility undermines stable fatigue signal.'
            }
        }

        // ── Budget Instability challenges ──
        if (h.cause === 'Budget Instability') {
            // Null-safe: no forecast = no budget hypothesis
            if (!forecastContext) {
                revisedConfidence = 0
                challenge = 'Forecast service unavailable — Budget Instability cannot be assessed.'
            } else if (forecastContext.modelConfidence === 'LOW') {
                revisedConfidence -= 0.2
                challenge = 'Forecast model confidence is LOW — budget hypothesis is uncertain.'
            }
        }

        // ── Audience Saturation challenges ──
        if (h.cause === 'Audience Saturation') {
            if (snapshotCount < 7) {
                revisedConfidence -= 0.15
                challenge = `Insufficient time-series depth (${snapshotCount} < 7). Saturation signal unreliable.`
            }
        }

        challenges.push({
            hypothesis: h.cause,
            challenge,
            revisedConfidence: clamp(revisedConfidence),
        })
    }

    return challenges
}
