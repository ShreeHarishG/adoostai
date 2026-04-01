/**
 * Creative Intervention Engine
 *
 * Generates actionable ad improvement suggestions based on the
 * diagnosed primary cause from the reasoning pipeline using Gemini API.
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

export interface CampaignContext {
    platform: string
    adType: string | null
    originalHeadline?: string
    targetAudience?: string
    objective?: string
}

// ─── Fallback Strategies ────────────────────────────────

const FALLBACK_STRATEGIES = [
    { type: 'HEADLINE', text: 'Test a new angle: rewrite the headline with a different value proposition', rationale: 'General performance decline — testing new messaging may identify what resonates' },
    { type: 'CTA', text: 'Strengthen the CTA: make it more specific and action-oriented', rationale: 'When root cause is unclear, CTA optimization is the safest starting point' },
    { type: 'REFRAME', text: 'Simplify the message: reduce the ad to one clear benefit and one clear action', rationale: 'Simplification often improves performance when multiple signals are declining' },
] as const

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

export async function generateCreativeInterventions(
    synthesizer: SynthesizerOutput,
    signal: SignalProfileInput,
    collaboration: CollaborationInput | null,
    campaignContext: CampaignContext
): Promise<CreativeSuggestionInput[]> {
    const { primaryCause, confidence } = synthesizer
    const signalContext = buildSignalContext(signal)

    const maxSuggestions = (collaboration?.verbosityPreference === 'CONCISE') ? 3 : 5

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.warn('[Creative Engine] No GEMINI_API_KEY found. Falling back to static strategies.')
        return FALLBACK_STRATEGIES.slice(0, maxSuggestions).map((strategy, index) => ({
            primaryCause,
            suggestionType: strategy.type,
            content: strategy.text,
            explanation: `Generated via fallback because API key is missing. ${strategy.rationale}`,
            confidenceImpact: Math.round(confidence * (1 - index * 0.05) * 100) / 100,
        }))
    }

    const prompt = `You are an expert ad creative strategist.

Campaign context:
- Platform: ${campaignContext.platform}
- Ad format: ${campaignContext.adType || 'Standard Ad'}
- Primary issue diagnosed: ${primaryCause}
- Signal health context: ${signalContext}
- Recommended system action: ${synthesizer.recommendedAction}
- Severity: ${synthesizer.severity}
${campaignContext.originalHeadline ? `- Current headline/copy: "${campaignContext.originalHeadline}"` : ''}
${campaignContext.targetAudience ? `- Target audience: ${campaignContext.targetAudience}` : ''}
${campaignContext.objective ? `- Campaign objective: ${campaignContext.objective}` : ''}

Generate ${maxSuggestions} specific, ready-to-use ad creative recommendations to solve this specific failure state. 
Be highly specific and provide exact copy to use.

Return JSON only, following this exact schema:
{
  "recommendations": [
    {
      "type": "HEADLINE|CTA|REFRAME|STRUCTURAL",
      "text": "the exact new headline or copy to use",
      "rationale": "one sentence explaining why this solves the primary issue",
      "priority": 1
    }
  ]
}`

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.7
                }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Gemini API error ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (!textContent) {
            throw new Error('Invalid response structure from Gemini API')
        }

        // Clean any potential markdown wrapping (though responseMimeType should prevent this)
        const cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanJson) as {
            recommendations: Array<{
                type: 'HEADLINE' | 'CTA' | 'REFRAME' | 'STRUCTURAL'
                text: string
                rationale: string
                priority: number
            }>
        }

        return parsed.recommendations.map((rec, index) => ({
            primaryCause,
            suggestionType: ['HEADLINE', 'CTA', 'REFRAME', 'STRUCTURAL'].includes(rec.type) ? rec.type : 'HEADLINE',
            content: rec.text,
            explanation: rec.rationale,
            // Degrade confidence slightly for lower priority items
            confidenceImpact: Math.max(0.1, Math.round(confidence * (1 - index * 0.05) * 100) / 100),
        }))

    } catch (error) {
        console.error('[Creative Engine] LLM generation failed, falling back:', error)
        
        return FALLBACK_STRATEGIES.slice(0, maxSuggestions).map((strategy, index) => ({
            primaryCause,
            suggestionType: strategy.type,
            content: strategy.text,
            explanation: `Generated via fallback due to API failure. ${strategy.rationale}`,
            confidenceImpact: Math.round(confidence * (1 - index * 0.05) * 100) / 100,
        }))
    }
}
