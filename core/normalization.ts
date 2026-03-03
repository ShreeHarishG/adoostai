/**
 * Signal Normalization Utility
 *
 * Min-Max scaling to [-1, 1] range using historical bounds.
 * normalizedValue = ((value - min) / (max - min)) * 2 - 1
 *
 * Falls back to 0 if min === max (no variance in data).
 */

import { prisma } from '@/lib/prisma'

// ─── Types ──────────────────────────────────────────────

export interface HistoricalBounds {
    ctrSlope: { min: number; max: number }
    cpaAcceleration: { min: number; max: number }
    impressionDecayRate: { min: number; max: number }
    spendEfficiencySlope: { min: number; max: number }
    engagementVolatility: { min: number; max: number }
}

export interface NormalizedSignals {
    normalizedCtrSlope: number
    normalizedCpaSlope: number
    normalizedImpressionDecay: number
    normalizedBurnRate: number
    normalizedVolatility: number
}

// ─── Core Math ──────────────────────────────────────────

/**
 * Min-Max normalize a value to [-1, 1].
 * Returns 0 if min === max (no variance).
 */
export function minMaxNormalize(value: number, min: number, max: number): number {
    if (max === min) return 0
    return ((value - min) / (max - min)) * 2 - 1
}

// ─── Historical Bounds ──────────────────────────────────

/**
 * Compute min/max for each signal across all stored SignalProfiles.
 * Used as the reference range for normalization.
 */
export async function computeHistoricalBounds(): Promise<HistoricalBounds> {
    const agg = await prisma.signalProfile.aggregate({
        _min: {
            ctrSlope: true,
            cpaAcceleration: true,
            impressionDecayRate: true,
            spendEfficiencySlope: true,
            engagementVolatility: true,
        },
        _max: {
            ctrSlope: true,
            cpaAcceleration: true,
            impressionDecayRate: true,
            spendEfficiencySlope: true,
            engagementVolatility: true,
        },
    })

    // Fallback to [-1, 1] range if no data exists
    const safe = (min: number | null, max: number | null) => ({
        min: min ?? -1,
        max: max ?? 1,
    })

    return {
        ctrSlope: safe(agg._min.ctrSlope, agg._max.ctrSlope),
        cpaAcceleration: safe(agg._min.cpaAcceleration, agg._max.cpaAcceleration),
        impressionDecayRate: safe(agg._min.impressionDecayRate, agg._max.impressionDecayRate),
        spendEfficiencySlope: safe(agg._min.spendEfficiencySlope, agg._max.spendEfficiencySlope),
        engagementVolatility: safe(agg._min.engagementVolatility, agg._max.engagementVolatility),
    }
}

// ─── Normalize a Signal Profile ─────────────────────────

export function normalizeSignals(
    raw: {
        ctrSlope: number
        cpaAcceleration: number
        impressionDecayRate: number
        spendEfficiencySlope: number
        engagementVolatility: number
    },
    bounds: HistoricalBounds,
): NormalizedSignals {
    return {
        normalizedCtrSlope: minMaxNormalize(raw.ctrSlope, bounds.ctrSlope.min, bounds.ctrSlope.max),
        normalizedCpaSlope: minMaxNormalize(raw.cpaAcceleration, bounds.cpaAcceleration.min, bounds.cpaAcceleration.max),
        normalizedImpressionDecay: minMaxNormalize(raw.impressionDecayRate, bounds.impressionDecayRate.min, bounds.impressionDecayRate.max),
        normalizedBurnRate: minMaxNormalize(raw.spendEfficiencySlope, bounds.spendEfficiencySlope.min, bounds.spendEfficiencySlope.max),
        normalizedVolatility: minMaxNormalize(raw.engagementVolatility, bounds.engagementVolatility.min, bounds.engagementVolatility.max),
    }
}
