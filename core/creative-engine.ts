/**
 * Creative Intervention Engine
 *
 * Generates actionable ad improvement suggestions based on the
 * diagnosed primary cause from the reasoning pipeline.
 *
 * Flow:
 *   primaryCause → strategy lookup → deterministic suggestion generation
 *
 * Each suggestion includes content + explainability reasoning
 * referencing the signal data that triggered it.
 */

import { SynthesizerOutput, CollaborationInput, SignalProfileInput } from './reasoning/types'

// ─── Types ──────────────────────────────────────────────

export interface CreativeSuggestionInput {
    primaryCause: string
    suggestionType: 'HEADLINE' | 'CTA' | 'REFRAME' | 'STRUCTURAL'
    content: string
    explanation: string
    confidenceImpact: number
}

// ─── Cause → Strategy Map ───────────────────────────────

interface Strategy {
    type: 'HEADLINE' | 'CTA' | 'REFRAME' | 'STRUCTURAL'
    template: string
    rationale: string
}

const CAUSE_STRATEGY_MAP: Record<string, Strategy[]> = {
    'Creative Fatigue': [
        { type: 'HEADLINE', template: 'Try a completely new angle: lead with a benefit your audience hasn\'t seen yet', rationale: 'CTR slope is negative — audience has seen the current hook too many times' },
        { type: 'HEADLINE', template: 'Add urgency: "Last chance" or "Limited availability" framing to re-engage', rationale: 'Engagement volatility suggests declining attention — urgency can recapture interest' },
        { type: 'HEADLINE', template: 'Flip the perspective: address a pain point instead of promoting a feature', rationale: 'Creative fatigue responds well to emotional reframing — pain > gain in saturated audiences' },
        { type: 'CTA', template: 'Replace generic CTA with action-specific language: "Get My [Result]" instead of "Learn More"', rationale: 'Specific CTAs outperform generic ones when engagement is dropping' },
        { type: 'CTA', template: 'Add social proof near CTA: "Join 10,000+ users" or "Rated 4.8/5"', rationale: 'Social proof reduces friction when audience trust is declining due to ad fatigue' },
        { type: 'REFRAME', template: 'Rewrite the emotional hook: shift from aspiration to fear-of-missing-out', rationale: 'Memory patterns show FOMO-based hooks perform well for fatigued creative' },
    ],

    'Budget Instability': [
        { type: 'CTA', template: 'Short-term aggressive CTA: "Act Now — Offer Ends [Date]" with clear deadline', rationale: 'High burn rate requires quick conversions — urgency CTAs maximize remaining budget' },
        { type: 'CTA', template: 'Scarcity-based CTA: "Only [X] spots left" to increase conversion pressure', rationale: 'Budget risk is HIGH — scarcity framing can improve ROAS before budget exhaustion' },
        { type: 'STRUCTURAL', template: 'Shorten the ad copy to reduce scroll-past rate. Lead with the strongest value prop in the first line', rationale: 'With limited budget runway, every impression must convert faster — shorter copy reduces bounce' },
        { type: 'HEADLINE', template: 'Lead with price/offer: make the deal immediately visible to maximize conversion per impression', rationale: 'Financial risk signals suggest optimizing for immediate conversion over brand awareness' },
    ],

    'Audience Saturation': [
        { type: 'HEADLINE', template: 'Add specificity: name the exact problem your product solves for this audience segment', rationale: 'Audience saturation means broad messaging is failing — specificity re-engages niche segments' },
        { type: 'HEADLINE', template: 'Clarify the target: "For [specific role/persona] who struggle with [specific problem]"', rationale: 'Impression decay rate is high — the current targeting may be too broad' },
        { type: 'REFRAME', template: 'Add a storytelling element: "I was spending 3 hours a day on [task] until I found this"', rationale: 'Narrative ads perform better than feature-based ads in saturated audiences' },
        { type: 'CTA', template: 'Personalized CTA: "See how it works for [your industry]" with dynamic content', rationale: 'Personalization improves engagement when generic messaging has plateaued' },
    ],

    'Weak Emotional Resonance': [
        { type: 'REFRAME', template: 'Reframe from logic to emotion: replace stats with a relatable scenario', rationale: 'Engagement signals suggest the audience isn\'t connecting emotionally with current copy' },
        { type: 'HEADLINE', template: 'Lead with the emotional outcome: "Finally feel confident about [result]"', rationale: 'Emotional hooks outperform logical ones when engagement volatility is high' },
        { type: 'STRUCTURAL', template: 'Add a before/after contrast: show the transformation your product enables', rationale: 'Contrast-based copy increases perceived value and emotional engagement' },
        { type: 'CTA', template: 'Emotion-driven CTA: "Start my transformation" instead of "Sign up"', rationale: 'Aligning CTA with emotional framing improves click consistency' },
    ],
}

// Fallback for unknown causes
const DEFAULT_STRATEGIES: Strategy[] = [
    { type: 'HEADLINE', template: 'Test a new angle: rewrite the headline with a different value proposition', rationale: 'General performance decline — testing new messaging may identify what resonates' },
    { type: 'CTA', template: 'Strengthen the CTA: make it more specific and action-oriented', rationale: 'When root cause is unclear, CTA optimization is the safest starting point' },
    { type: 'REFRAME', template: 'Simplify the message: reduce the ad to one clear benefit and one clear action', rationale: 'Simplification often improves performance when multiple signals are declining' },
]

// ─── Signal Context Builder ─────────────────────────────

function buildSignalContext(signal: SignalProfileInput): string {
    const parts: string[] = []
    if (signal.ctrSlope < -0.1) parts.push('CTR slope negative')
    if (signal.cpaAcceleration > 0.1) parts.push('CPA accelerating upward')
    if (signal.impressionDecayRate > 0.15) parts.push('impression decay detected')
    if (signal.engagementVolatility > 0.3) parts.push('engagement volatility high')
    if (signal.spendEfficiencySlope < -0.1) parts.push('spend efficiency declining')
    return parts.length > 0 ? parts.join('; ') : 'general performance degradation'
}

// ─── Main Generator ─────────────────────────────────────

export function generateCreativeInterventions(
    synthesizer: SynthesizerOutput,
    signal: SignalProfileInput,
    collaboration: CollaborationInput | null,
): CreativeSuggestionInput[] {
    const { primaryCause, confidence } = synthesizer
    const strategies = CAUSE_STRATEGY_MAP[primaryCause] ?? DEFAULT_STRATEGIES
    const signalContext = buildSignalContext(signal)

    // If user prefers CONCISE, limit to top 3 suggestions
    const maxSuggestions = (collaboration?.verbosityPreference === 'CONCISE') ? 3 : strategies.length

    const suggestions: CreativeSuggestionInput[] = strategies
        .slice(0, maxSuggestions)
        .map((strategy, index) => ({
            primaryCause,
            suggestionType: strategy.type,
            content: strategy.template,
            explanation: `Generated because: ${signalContext}. ${strategy.rationale}`,
            confidenceImpact: Math.round(confidence * (1 - index * 0.05) * 100) / 100,
        }))

    return suggestions
}
