// Core types for AdBoostAI Phase 1

export interface AdInput {
  id: string;
  adCopy: string;
  headline: string;
  description: string;
  cta: string;
  platform: 'meta' | 'google' | 'youtube' | 'other';
  targetAudience: string;
  objective: string;
}

export interface PerformanceMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  roas: number;
  frequency: number;
  durationDays: number;
}

export interface FeedbackData {
  sentiment: 'positive' | 'neutral' | 'negative';
  commonThemes: string[];
  recentComments: string[];
}

export type FatigueLevel = 'low' | 'moderate' | 'high' | 'critical';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CampaignStatus = 'DRAFT' | 'ANALYZING' | 'DECISION_READY' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED' | 'FAILED';
export type PrimaryIssue = 'LOW_CTR' | 'HIGH_CPM' | 'SATURATION' | 'NEGATIVE_SENTIMENT' | 'NONE';
export type ActionType = 'REFRESH' | 'PAUSE' | 'TEST' | 'CONTINUE';

export interface FatigueDiagnosis {
  level: FatigueLevel;
  confidence: number;
  primaryReasons: string[];
  impactScore: number;
  severityLevel?: SeverityLevel;
}

export interface StructuredRecommendation {
  type: 'creative' | 'messaging' | 'targeting' | 'budget' | 'format' | 'cta';
  text: string;
  priority: number;
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'creative' | 'messaging' | 'targeting' | 'budget' | 'format';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  adId: string;
  fatigueDiagnosis: FatigueDiagnosis;
  recommendations: Recommendation[] | string; // Sticking to previous format compatibility, but supporting new
  structuredRecommendations?: StructuredRecommendation[];
  summary: string;
  timestamp: Date;
}

export interface AnalysisRequest {
  adInput: AdInput;
  performanceMetrics: PerformanceMetrics;
  feedbackData?: FeedbackData;
}
