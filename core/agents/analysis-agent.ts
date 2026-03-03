import { PerformanceMetrics, FeedbackData } from '@/types'
import { AnalysisOutput } from '@/types/agents'

/**
 * Agent 1: Analysis Agent
 * 
 * STRICTLY PURE. No DB access, no external dependencies.
 * Responsibility: Interprets raw telemetry input into deterministic deviations.
 */
export function analysisAgent(metrics: PerformanceMetrics, feedback?: FeedbackData): AnalysisOutput {
    // We determine what is considered a deviation based on strict threshold numbers.
    const hasLowCTR = metrics.ctr < 1.0;
    const hasHighCPM = metrics.cpm > 20;

    // Checking saturation via duration and mock frequency
    const frequency = metrics.frequency ?? 1; // Explicitly allowed fallback since frequency might be unrecorded initially
    const isSaturated = metrics.durationDays > 14 && frequency > 3;

    const hasNegativeSentiment = feedback !== undefined && feedback.sentiment === 'negative';

    return {
        hasLowCTR,
        hasHighCPM,
        isSaturated,
        hasNegativeSentiment
    };
}
