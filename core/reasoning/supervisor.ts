/**
 * Supervisor – Debate Orchestrator
 *
 * Controls the execution order of the structured debate protocol:
 *   R1:   Analyst     – produce ranked hypotheses
 *   R2:   Critic      – challenge hypotheses
 *   R2.5: Memory      – similarity-based confidence adjustment
 *   R3:   Synthesizer – final decision (with collaboration adaptation)
 *
 * Phase 5: Synthesizer now receives CollaborationInput for behavioral adaptation.
 */

import { ForecastContext } from '@/types/agents'
import {
    CollaborationInput,
    DebateResult,
    DebateRound,
    SimilarCampaign,
    SignalProfileInput,
} from './types'
import { analystAgent } from './analyst'
import { criticAgent } from './critic'
import { memoryAgent } from './memory'
import { synthesizerAgent } from './synthesizer'

export function runDebate(
    signal: SignalProfileInput,
    forecastContext: ForecastContext | null,
    similarCampaigns: SimilarCampaign[],
    snapshotCount: number,
    collaboration: CollaborationInput | null = null,
): DebateResult {
    const rounds: DebateRound[] = []

    // ═══ Round 1: Analyst ═══
    const hypotheses = analystAgent(signal, forecastContext, snapshotCount)
    rounds.push({
        agent: 'ANALYST',
        round: 1,
        output: hypotheses,
        timestamp: new Date().toISOString(),
    })

    // ═══ Round 2: Critic ═══
    const challenges = criticAgent(
        hypotheses,
        snapshotCount,
        signal.engagementVolatility,
        forecastContext,
    )
    rounds.push({
        agent: 'CRITIC',
        round: 2,
        output: challenges,
        timestamp: new Date().toISOString(),
    })

    // ═══ Round 2.5: Memory ═══
    const topHypothesis = hypotheses[0]?.cause || 'Unknown'
    const memContext = memoryAgent(topHypothesis, similarCampaigns)
    rounds.push({
        agent: 'MEMORY',
        round: 2.5,
        output: memContext,
        timestamp: new Date().toISOString(),
    })

    // ═══ Round 3: Synthesizer (with collaboration adaptation) ═══
    const synthOutput = synthesizerAgent(challenges, forecastContext, memContext, collaboration)
    rounds.push({
        agent: 'SYNTHESIZER',
        round: 3,
        output: synthOutput,
        timestamp: new Date().toISOString(),
    })

    return {
        rounds,
        analystHypotheses: hypotheses,
        criticChallenges: challenges,
        memoryContext: memContext,
        synthesizerOutput: synthOutput,
    }
}
