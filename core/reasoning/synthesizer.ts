/**
 * Synthesizer Agent – Round 3 of Structured Debate
 *
 * STRICTLY PURE. No DB access.
 * Combines Critic-revised hypotheses + forecast signals + memory context
 * + collaboration profile into a single decision output.
 *
 * Phase 5 additions:
 *   - Severity adjustment based on riskToleranceScore
 *   - Confidence penalty from disagreementSuccessRate
 *   - Tone/verbosity adaptation from user behavior
 *   - Full collaboration adjustment logging
 */

import { SeverityLevel, ActionType } from '@/types'
import { ForecastContext } from '@/types/agents'
import { CriticChallenge, MemoryContext, SynthesizerOutput, CollaborationInput } from './types'

const clamp = (v: number): number => Math.min(1, Math.max(0, v))

const SEVERITY_ORDER: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function severityIndex(s: SeverityLevel): number {
    return SEVERITY_ORDER.indexOf(s)
}

function shiftSeverity(s: SeverityLevel, delta: number): SeverityLevel {
    const idx = Math.max(0, Math.min(SEVERITY_ORDER.length - 1, severityIndex(s) + delta))
    return SEVERITY_ORDER[idx]
}

export function synthesizerAgent(
    criticChallenges: CriticChallenge[],
    forecastContext: ForecastContext | null,
    memoryContext: MemoryContext,
    collaboration: CollaborationInput | null = null,
): SynthesizerOutput {
    // 1. Find the top hypothesis (highest revised confidence)
    const sorted = [...criticChallenges].sort(
        (a, b) => b.revisedConfidence - a.revisedConfidence,
    )
    const top = sorted[0]

    // 2. Apply memory adjustment
    let finalConfidence = clamp(top.revisedConfidence + memoryContext.confidenceAdjustment)

    // 3. Apply forecast amplification
    if (forecastContext) {
        if (forecastContext.budgetRiskLevel === 'HIGH') {
            finalConfidence = clamp(finalConfidence + 0.1)
        }
        if (forecastContext.statisticalConfidenceRisk === 'HIGH') {
            finalConfidence = clamp(finalConfidence + 0.05)
        }
    }

    // 4. Map confidence → base severity
    let baseSeverity: SeverityLevel
    if (finalConfidence >= 0.8) {
        baseSeverity = 'CRITICAL'
    } else if (finalConfidence >= 0.6) {
        baseSeverity = 'HIGH'
    } else if (finalConfidence >= 0.4) {
        baseSeverity = 'MEDIUM'
    } else {
        baseSeverity = 'LOW'
    }

    // 5. Apply collaboration adjustment (Phase 5)
    let adjustedSeverity = baseSeverity
    let adjustmentReason = 'No collaboration data'
    let verbosityLevel = 'DETAILED'

    if (collaboration) {
        // Risk tolerance adjustment
        if (collaboration.riskToleranceScore > 0.7) {
            adjustedSeverity = shiftSeverity(baseSeverity, -1) // Reduce severity
            adjustmentReason = `High risk tolerance (${(collaboration.riskToleranceScore * 100).toFixed(0)}%) — severity reduced`
        } else if (collaboration.riskToleranceScore < 0.3) {
            adjustedSeverity = shiftSeverity(baseSeverity, 1) // Increase early warnings
            adjustmentReason = `Low risk tolerance (${(collaboration.riskToleranceScore * 100).toFixed(0)}%) — severity increased`
        } else {
            adjustmentReason = `Moderate risk tolerance (${(collaboration.riskToleranceScore * 100).toFixed(0)}%) — no severity change`
        }

        // Disagreement success penalty
        if (collaboration.disagreementSuccessRate > 0.6) {
            finalConfidence = clamp(finalConfidence - 0.05)
            adjustmentReason += '; high disagreement success — AI confidence -5%'
        }

        // Tone/verbosity adaptation
        verbosityLevel = (collaboration.verbosityPreference === 'CONCISE' || collaboration.rejectRate > 0.6)
            ? 'CONCISE'
            : 'DETAILED'
    }

    const severity = adjustedSeverity

    // 6. Map cause + severity → action
    let recommendedAction: ActionType
    if (severity === 'CRITICAL') {
        recommendedAction = 'PAUSE'
    } else if (top.hypothesis === 'Creative Fatigue' && severity !== 'LOW') {
        recommendedAction = 'REFRESH'
    } else if (top.hypothesis === 'Budget Instability') {
        recommendedAction = severity === 'HIGH' ? 'PAUSE' : 'TEST'
    } else if (severity === 'LOW') {
        recommendedAction = 'CONTINUE'
    } else {
        recommendedAction = 'TEST'
    }

    // 7. Uncertainty = 1 - confidence
    const uncertainty = clamp(1 - finalConfidence)

    return {
        primaryCause: top.hypothesis,
        severity,
        recommendedAction,
        confidence: finalConfidence,
        uncertainty,
        verbosityLevel,
        collaborationAdjustment: collaboration ? {
            baseSeverity,
            adjustedSeverity,
            verbosityLevel,
            adjustmentReason,
        } : null,
    }
}
