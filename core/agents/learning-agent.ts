import { LearningOutput } from '@/types/agents'
import { SeverityLevel } from '@/types'

export interface RawDecisionHistory {
    actionTaken: string;
    notes: string | null;
    campaignId: string;
    // We expect the system's severity and suggested action at the time of the decision
    systemSeverity?: SeverityLevel;
    systemSuggestedAction?: string;
}

/**
 * Agent 3: Learning Agent (Advisory Only)
 * 
 * STRICTLY PURE. No DB access, no external dependencies.
 * Responsibility: Analyzes past decisions mathematically to find directional bias 
 * (Historical Bias Score) and alignment (Contradiction Weight).
 */
export function learningAgent(pastDecisions: RawDecisionHistory[]): LearningOutput {
    if (pastDecisions.length === 0) {
        return {
            historicalOverrideRate: 0,
            commonPastIssues: [],
            suggestedConfidenceAdjustment: 0,
            historicalBiasScore: 0,
            contradictionWeight: 0
        };
    }

    const totalDecisions = pastDecisions.length;
    let overrideCount = 0;

    // Mathematical Weights
    let pauseScore = 0;
    let contradictionScore = 0;

    const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
        'LOW': 1.0,    // Pausing at LOW severity = high bias value (1.0)
        'MEDIUM': 0.6, // Pausing at MEDIUM = moderate bias (0.6)
        'HIGH': 0.2,   // Pausing at HIGH = expected behavior (low bias 0.2)
        'CRITICAL': 0.0 // Pausing at CRITICAL = zero bias (0.0)
    };

    pastDecisions.forEach(d => {
        const isPause = d.actionTaken === 'PAUSE';
        const sysAction = d.systemSuggestedAction || 'CONTINUE';
        const sysSeverity = d.systemSeverity || 'LOW';

        // 1. Contradiction Tracking
        if (d.actionTaken !== sysAction) {
            overrideCount++;

            // Diametrically opposed decisions (System: CONTINUE, User: PAUSE) 
            // carry a heavy contradiction weight of 2.0. Minor overrides carry 1.0.
            if ((sysAction === 'CONTINUE' && isPause) || (sysAction === 'PAUSE' && d.actionTaken === 'CONTINUE')) {
                contradictionScore += 2.0;
            } else {
                contradictionScore += 1.0;
            }
        }

        // 2. Pause Frequency Weighted by Severity
        // If a user pauses, we check how severe the system thought it was.
        // Pausing when the system thought it was LOW severity adds 1.0 to the bias score.
        if (isPause) {
            pauseScore += SEVERITY_WEIGHTS[sysSeverity];
        } else if (d.actionTaken === 'REFRESH') {
            pauseScore -= 0.5; // Refreshing counteracts trigger-happy pausing
        }
    });

    const historicalOverrideRate = overrideCount / totalDecisions;
    const contradictionWeight = contradictionScore / totalDecisions; // Normalized avg contradiction per decision

    // 3. Historical Bias Score (-100 to +100)
    // +100 = Extremely trigger happy (pauses constantly even on low severity)
    // -100 = Extremely patient (never pauses, only refreshes/continues)
    let historicalBiasScore = (pauseScore / totalDecisions) * 100;
    historicalBiasScore = Math.max(-100, Math.min(historicalBiasScore, 100));

    // Compile Common Issues
    const commonPastIssues: string[] = [];
    if (historicalBiasScore > 40) commonPastIssues.push('Chronic User Fatigue/Pausing');
    if (historicalBiasScore < -20) commonPastIssues.push('High Creative Refresh Cadence');

    // 4. Suggested Confidence Adjustment
    // We map the Bias Score to a small tweak (-15 to +15) linearly.
    // If they are highly biased to pause (+50 score), we might adjust 
    // confidence by -7% on non-pause recommendations.
    let suggestedConfidenceAdjustment = 0;
    if (historicalBiasScore > 40) {
        suggestedConfidenceAdjustment = -10;
    } else if (historicalBiasScore < -20) {
        suggestedConfidenceAdjustment = +5;
    }

    // High contradiction implies the user ignores us often,
    // so we lower our overall confidence slightly across the board.
    if (contradictionWeight > 1.0) {
        suggestedConfidenceAdjustment -= 5;
    }

    return {
        historicalOverrideRate,
        commonPastIssues,
        suggestedConfidenceAdjustment,
        historicalBiasScore: Math.round(historicalBiasScore),
        contradictionWeight: Math.round(contradictionWeight * 100) / 100
    };
}
