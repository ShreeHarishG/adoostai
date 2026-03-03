import { SeverityLevel, ActionType } from '@/types'

// ─── Hypothesis ─────────────────────────────────────────
/**
 * A scored causal hypothesis produced by the Analyst.
 * `weights` documents how each signal contributed to the final confidence.
 * Confidence is strictly bounded [0, 1].
 */
export interface Hypothesis {
    cause: string
    confidence: number
    weights: Record<string, number>
}

// ─── Critic Challenge ───────────────────────────────────
/**
 * A Critic's challenge against a hypothesis.
 * `revisedConfidence` is clamped [0, 1].
 */
export interface CriticChallenge {
    hypothesis: string
    challenge: string
    revisedConfidence: number
}

// ─── Debate Round ───────────────────────────────────────
/**
 * One logged step in the structured debate.
 */
export interface DebateRound {
    agent: string
    round: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any
    timestamp: string
}

// ─── Collaboration Input ───────────────────────────────
/**
 * User behavioral profile passed into the Synthesizer.
 */
export interface CollaborationInput {
    riskToleranceScore: number     // 0 = cautious, 1 = aggressive
    disagreementSuccessRate: number
    rejectRate: number
    verbosityPreference: string    // CONCISE | DETAILED
}

// ─── Synthesizer Output ────────────────────────────────
/**
 * The final, unified decision produced by the Synthesizer.
 */
export interface SynthesizerOutput {
    primaryCause: string
    severity: SeverityLevel
    recommendedAction: ActionType
    confidence: number
    uncertainty: number
    verbosityLevel: string         // CONCISE | DETAILED
    collaborationAdjustment: {
        baseSeverity: SeverityLevel
        adjustedSeverity: SeverityLevel
        verbosityLevel: string
        adjustmentReason: string
    } | null
}

// ─── Similar Campaign Match ────────────────────────────
/**
 * A past campaign matched by the memory engine.
 */
export interface SimilarCampaign {
    campaignId: string
    similarityScore: number
    finalDecision: string
    outcomeStatus: string  // PENDING | SUCCESS | FAILED | UNKNOWN
}

// ─── Memory Context ─────────────────────────────────────
/**
 * Historical pattern context from the memory engine.
 */
export interface MemoryContext {
    similarPatternCount: number
    confidenceAdjustment: number  // +/- 0.05
    matchedIssues: string[]
    similarCampaigns: SimilarCampaign[]
}

// ─── Full Debate Result ────────────────────────────────
/**
 * Complete debate output from the Supervisor, ready for DB storage.
 */
export interface DebateResult {
    rounds: DebateRound[]
    analystHypotheses: Hypothesis[]
    criticChallenges: CriticChallenge[]
    memoryContext: MemoryContext
    synthesizerOutput: SynthesizerOutput
}

// ─── Signal Profile Input ──────────────────────────────
/**
 * Typed input matching the Prisma SignalProfile model fields.
 * Used by the Analyst instead of raw DB row.
 */
export interface SignalProfileInput {
    ctrSlope: number
    cpaAcceleration: number
    impressionDecayRate: number
    spendEfficiencySlope: number
    engagementVolatility: number
}
