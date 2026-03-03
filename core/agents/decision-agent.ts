import { FatigueOutput, LearningOutput, DecisionOutput, ForecastContext } from '@/types/agents'
import { SeverityLevel, ActionType } from '@/types'

// Severity escalation order for budget risk adjustments
const SEVERITY_ORDER: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Agent 4: Decision Agent
 * 
 * STRICTLY PURE. No DB access, no external dependencies.
 * Responsibility: Maps a deterministic action strategy from the fatigue score,
 * and tweaks the `confidenceScore` using the advisory context from the Learning Agent.
 * Now also incorporates financial intelligence from the Forecast Engine.
 */
export function decisionAgent(
    fatigue: FatigueOutput,
    learningContext: LearningOutput,
    forecastContext?: ForecastContext | null
): DecisionOutput {
    const { score: fatigueScore, primaryIssue } = fatigue;

    let severityLevel: SeverityLevel = 'LOW';
    let suggestedAction: ActionType = 'CONTINUE';
    let confidenceScore = 80; // Objective base confidence

    // Deterministic Thresholds
    if (fatigueScore >= 80) {
        severityLevel = 'CRITICAL';
        suggestedAction = 'PAUSE';
        confidenceScore = 95;
    } else if (fatigueScore >= 60) {
        severityLevel = 'HIGH';
        suggestedAction = 'REFRESH';
        confidenceScore = 85;
    } else if (fatigueScore >= 40) {
        severityLevel = 'MEDIUM';
        suggestedAction = 'TEST'; // "Adjust Targeting" converted to strictly "TEST"
        confidenceScore = 70;
    }

    if (primaryIssue === 'NEGATIVE_SENTIMENT' && severityLevel !== 'CRITICAL') {
        severityLevel = 'HIGH';
        suggestedAction = 'REFRESH'; // Message Refresh
    }

    // --- Advisory Adjustments ---
    // Apply the Learning Agent's context without mutating the severity or core action recommendation.
    confidenceScore += learningContext.suggestedConfidenceAdjustment;

    if (learningContext.commonPastIssues.includes('Chronic User Fatigue/Pausing') && suggestedAction !== 'PAUSE') {
        // If user usually pauses but we recommend something else, our confidence drops
        confidenceScore -= 10;
    } else if (learningContext.commonPastIssues.includes('High Creative Refresh Cadence') && suggestedAction === 'REFRESH') {
        // If user loves to refresh creatives, our confidence in a refresh recommendation rises
        confidenceScore += 10;
    }

    // --- Financial Intelligence Adjustments ---
    if (forecastContext) {
        // Budget risk: escalate severity by one level if HIGH
        if (forecastContext.budgetRiskLevel === 'HIGH') {
            const currentIndex = SEVERITY_ORDER.indexOf(severityLevel);
            if (currentIndex < SEVERITY_ORDER.length - 1) {
                severityLevel = SEVERITY_ORDER[currentIndex + 1];
            }
        }

        // Statistical exposure risk: if HIGH, flag for budget extension
        if (forecastContext.statisticalConfidenceRisk === 'HIGH' && suggestedAction === 'CONTINUE') {
            suggestedAction = 'TEST'; // Recommend extending/adjusting budget instead of continuing blindly
        }

        // Model confidence: reduce our confidence if forecast model is unsure
        if (forecastContext.modelConfidence === 'LOW') {
            confidenceScore -= 10;
        }
    }

    // Cap confidence within bounds
    confidenceScore = Math.max(0, Math.min(confidenceScore, 100));

    return { severityLevel, suggestedAction, confidenceScore };
}
