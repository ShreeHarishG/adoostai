/**
 * Analyst Agent – Round 1 of Structured Debate
 *
 * STRICTLY PURE. No DB access.
 * Produces ranked causal hypotheses from SignalProfile + ForecastContext.
 *
 * Scoring rules:
 *   - Every hypothesis weight vector sums to exactly 1.0
 *   - All raw signals are normalised to [0, 1] before weighting
 *   - Final confidence is bounded [0, 1]
 */

import { ForecastContext } from '@/types/agents'
import { Hypothesis, SignalProfileInput } from './types'

// ─── Normalisers ────────────────────────────────────────

/** Clamp a value to [0, 1]. */
const clamp = (v: number): number => Math.min(1, Math.max(0, v))

/**
 * Normalise a slope-style metric.
 * Slopes live roughly in [-1, 1]; we map the absolute magnitude to [0, 1].
 */
const normSlope = (v: number): number => clamp(Math.abs(v))

/**
 * Normalise a rate / volatility metric already roughly in [0, 1].
 */
const normRate = (v: number): number => clamp(Math.abs(v))

// ─── Public API ─────────────────────────────────────────

export function analystAgent(
    signal: SignalProfileInput,
    forecastContext: ForecastContext | null,
    snapshotCount: number,
): Hypothesis[] {
    const hypotheses: Hypothesis[] = []

    // 1️⃣ Creative Fatigue  (weights sum = 0.4 + 0.3 + 0.2 + 0.1 = 1.0)
    {
        const ctr = normSlope(signal.ctrSlope)
        const decay = normRate(signal.impressionDecayRate)
        const vol = normRate(signal.engagementVolatility)
        const dataSuff = clamp(snapshotCount / 14) // 14 snapshots = full sufficiency

        const confidence = clamp(
            ctr * 0.4 +
            decay * 0.3 +
            vol * 0.2 +
            dataSuff * 0.1,
        )

        hypotheses.push({
            cause: 'Creative Fatigue',
            confidence,
            weights: {
                ctrSlope: 0.4,
                impressionDecay: 0.3,
                engagementVolatility: 0.2,
                dataSufficiency: 0.1,
            },
        })
    }

    // 2️⃣ Budget Instability  (weights sum = 0.5 + 0.3 + 0.2 = 1.0)
    //    Null-safe: scored 0 when forecastContext is unavailable.
    {
        let confidence = 0
        const weights: Record<string, number> = {
            burnRateTrend: 0.5,
            cpaAcceleration: 0.3,
            spendEfficiency: 0.2,
        }

        if (forecastContext && forecastContext.projectedBurnRate != null) {
            const burnTrend = normRate(
                forecastContext.budgetRiskLevel === 'HIGH' ? 1
                    : forecastContext.budgetRiskLevel === 'MEDIUM' ? 0.5
                        : 0.1,
            )
            const cpaAcc = normSlope(signal.cpaAcceleration)
            const spendEff = normSlope(signal.spendEfficiencySlope)

            confidence = clamp(
                burnTrend * 0.5 +
                cpaAcc * 0.3 +
                spendEff * 0.2,
            )
        }

        hypotheses.push({ cause: 'Budget Instability', confidence, weights })
    }

    // 3️⃣ Audience Saturation  (weights sum = 0.5 + 0.3 + 0.2 = 1.0)
    {
        const decay = normRate(signal.impressionDecayRate)
        const ctr = normSlope(signal.ctrSlope)
        const vol = normRate(signal.engagementVolatility)

        const confidence = clamp(
            decay * 0.5 +
            ctr * 0.3 +
            vol * 0.2,
        )

        hypotheses.push({
            cause: 'Audience Saturation',
            confidence,
            weights: {
                impressionDecay: 0.5,
                ctrSlope: 0.3,
                engagementVolatility: 0.2,
            },
        })
    }

    // Sort descending by confidence
    hypotheses.sort((a, b) => b.confidence - a.confidence)
    return hypotheses
}
