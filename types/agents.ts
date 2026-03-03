import { SeverityLevel, PrimaryIssue, ActionType } from './index';

export interface AnalysisOutput {
    hasLowCTR: boolean;
    hasHighCPM: boolean;
    isSaturated: boolean;
    hasNegativeSentiment: boolean;
}

export interface FatigueOutput {
    score: number;
    primaryIssue: PrimaryIssue;
    weightBreakdown: {
        ctrImpact: number;
        cpmImpact: number;
        saturationImpact: number;
        sentimentImpact: number;
    };
}

export interface LearningOutput {
    historicalOverrideRate: number;
    commonPastIssues: string[];
    suggestedConfidenceAdjustment: number;
    historicalBiasScore: number;
    contradictionWeight: number;
}

export interface DecisionOutput {
    severityLevel: SeverityLevel;
    confidenceScore: number;
    suggestedAction: ActionType;
}

export interface ForecastContext {
    predictedSpendExhaustionDate: string | null;
    projectedBurnRate: number | null;
    statisticalConfidenceRisk: string;
    budgetRiskLevel: string;
    modelConfidence: string;
}
