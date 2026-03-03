import { DecisionOutput } from '@/types/agents'
import { StructuredRecommendation, PrimaryIssue } from '@/types'

/**
 * Agent 5: Recommendation Agent
 * 
 * STRICTLY PURE. No DB access, no external dependencies.
 * Responsibility: Uses base deterministic template libraries to generate the 
 * final action output. Prepares for future LLM textual enhancement strings.
 */
export function recommendationAgent(decision: DecisionOutput, primaryIssue: PrimaryIssue): StructuredRecommendation[] {
    const recs: StructuredRecommendation[] = [];

    // Deterministic Base Template Library
    if (decision.suggestedAction === 'PAUSE') {
        recs.push({ type: 'creative', text: 'Immediately pause the ad to prevent further negative ROI/burnout.', priority: 1 });

        if (primaryIssue === 'SATURATION') {
            recs.push({ type: 'targeting', text: 'Analyze audience overlap to prevent saturation bleed into other campaigns.', priority: 2 });
        }
    } else if (decision.suggestedAction === 'REFRESH') {
        recs.push({ type: 'creative', text: 'Design new visual assets (images/videos) to combat ad blindness.', priority: 1 });

        if (primaryIssue === 'NEGATIVE_SENTIMENT') {
            recs.push({ type: 'messaging', text: 'Rewrite ad copy to directly address the concerns raised in feedback.', priority: 1 });
        } else {
            recs.push({ type: 'format', text: 'Test a new creative format (e.g., Carousel or Reels).', priority: 2 });
        }
    } else if (decision.suggestedAction === 'TEST') {
        recs.push({ type: 'targeting', text: 'Broaden or shift audience segments to find cheaper CPMs.', priority: 1 });
        recs.push({ type: 'cta', text: 'Ensure the Call To Action applies to this new exploratory segment.', priority: 2 });
    } else {
        // CONTINUE
        recs.push({ type: 'creative', text: 'Continue monitoring performance metrics. No immediate intervention required.', priority: 1 });
    }

    // *Future Note*: We can map over `recs` here and pass the pure JSON payload out
    // to an external LLM function in the Orchestrator to "enhance" the `text` field, 
    // keeping this agent pure while enabling LLM intelligence.

    return recs;
}
