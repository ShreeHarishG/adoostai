import { AnalysisOutput, FatigueOutput } from '@/types/agents'
import { PrimaryIssue } from '@/types'

/**
 * Agent 2: Fatigue Agent
 * 
 * STRICTLY PURE. No DB access, no external dependencies.
 * Responsibility: Assigns a numerical fatigue score and root primary issue 
 * based solely on the structured deviations provided by the Analysis Agent.
 * Now provides a strict mathematical breakdown.
 */
export function fatigueAgent(analysis: AnalysisOutput): FatigueOutput {
    let score = 50; // Starting baseline

    let ctrImpact = 0;
    let cpmImpact = 0;
    let saturationImpact = 0;
    let sentimentImpact = 0;

    if (analysis.hasLowCTR) ctrImpact = 30;
    if (analysis.hasHighCPM) cpmImpact = 15;
    if (analysis.isSaturated) saturationImpact = 25;
    if (analysis.hasNegativeSentiment) sentimentImpact = 20;

    score += (ctrImpact + cpmImpact + saturationImpact + sentimentImpact);
    score = Math.min(score, 100);

    // Determine the primary issue deterministically. 
    // Priority: Saturation > Negative Sentiment > Low CTR > High CPM
    let primaryIssue: PrimaryIssue = 'NONE';

    if (analysis.isSaturated) {
        primaryIssue = 'SATURATION';
    } else if (analysis.hasNegativeSentiment) {
        primaryIssue = 'NEGATIVE_SENTIMENT';
    } else if (analysis.hasLowCTR) {
        primaryIssue = 'LOW_CTR';
    } else if (analysis.hasHighCPM) {
        primaryIssue = 'HIGH_CPM';
    } else {
        score = 0; // If there are zero deviations, fatigue must be 0, not baseline 50.
        primaryIssue = 'NONE';
    }

    return {
        score,
        primaryIssue,
        weightBreakdown: {
            ctrImpact,
            cpmImpact,
            saturationImpact,
            sentimentImpact
        }
    };
}
