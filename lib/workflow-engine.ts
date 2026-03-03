import { prisma } from './prisma'
import { PerformanceMetrics, FeedbackData } from '@/types'
import { ForecastContext } from '@/types/agents'
import { analysisAgent } from '@/core/agents/analysis-agent'
import { fatigueAgent } from '@/core/agents/fatigue-agent'
import { learningAgent } from '@/core/agents/learning-agent'
import { runDebate } from '@/core/reasoning/supervisor'
import { CollaborationInput, SignalProfileInput } from '@/core/reasoning/types'
import { computeHistoricalBounds, normalizeSignals } from '@/core/normalization'
import { findSimilarCampaigns } from '@/core/memory-engine'
import { generateCreativeInterventions } from '@/core/creative-engine'

// ─── Data Loading Boundary ─────────────────────────────

async function loadWorkflowContext(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
    });

    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
    if (!campaign.metrics) throw new Error('Cannot run analysis without metrics');

    const rawMetrics: PerformanceMetrics = JSON.parse(campaign.metrics);
    const metrics = { ...rawMetrics, frequency: rawMetrics.frequency ?? 1 };

    const feedback: FeedbackData | undefined = campaign.feedback ? JSON.parse(campaign.feedback) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decisionHistory = await prisma.decisionHistory.findMany({
        where: { campaign: { userId: campaign.userId } },
        select: { actionTaken: true, notes: true, campaignId: true },
    });

    const snapshotCount = await prisma.performanceSnapshot.count({
        where: { campaignId },
    });

    return { campaign, metrics, feedback, decisionHistory, snapshotCount };
}

// ─── Logging Helper ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createLogPayload(campaignId: string, stepName: string, data: any) {
    return prisma.workflowLog.create({
        data: {
            campaignId,
            step: stepName,
            payload: JSON.stringify(data),
        }
    });
}

// ─── The Orchestrator ──────────────────────────────────
// Phase 6 pipeline:
// Signal Engine → Normalize → Forecast → Memory → Collaboration → Debate → Creative Engine → Store

export async function processCampaignWorkflow(campaignId: string) {
    try {
        // 0. Set status to ANALYZING
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'ANALYZING' },
        });

        // 1. I/O BOUNDARY: Read state
        const { campaign, metrics, feedback, snapshotCount } =
            await loadWorkflowContext(campaignId);

        const agentDelay = () => new Promise(resolve => setTimeout(resolve, 800));

        // ═══ Step A: Signal Engine (legacy analysis + fatigue agents) ═══
        const analysisContext = analysisAgent(metrics, feedback);
        await createLogPayload(campaignId, 'ANALYSIS_AGENT', analysisContext);
        await agentDelay();

        const fatigueContext = fatigueAgent(analysisContext);
        await createLogPayload(campaignId, 'FATIGUE_AGENT', fatigueContext);
        await agentDelay();

        // Legacy learning agent (backward-compat for AnalysisRun)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const historicalContext = learningAgent([] as any);
        await createLogPayload(campaignId, 'LEARNING_AGENT', historicalContext);
        await agentDelay();

        // Build raw signal profile
        const signalProfile: SignalProfileInput = {
            ctrSlope: fatigueContext.weightBreakdown.ctrImpact / 100,
            cpaAcceleration: metrics.cpa > 30 ? 0.7 : metrics.cpa > 15 ? 0.4 : 0.1,
            impressionDecayRate: fatigueContext.weightBreakdown.saturationImpact / 100,
            spendEfficiencySlope: metrics.roas < 1 ? 0.8 : metrics.roas < 2 ? 0.4 : 0.1,
            engagementVolatility: fatigueContext.weightBreakdown.sentimentImpact / 100,
        };

        // ═══ Step A2: Normalize + Store SignalProfile (Phase 4) ═══
        const bounds = await computeHistoricalBounds();
        const normalized = normalizeSignals(signalProfile, bounds);

        await prisma.signalProfile.create({
            data: {
                campaignId,
                ...signalProfile,
                ...normalized,
            },
        });
        await createLogPayload(campaignId, 'SIGNAL_NORMALIZE', { raw: signalProfile, normalized, bounds });
        await agentDelay();

        // ═══ Step B: Forecast Engine (Python backend) ═══
        let forecastData: ForecastContext | null = null;

        try {
            const forecastResponse = await fetch('http://localhost:8000/forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaign_id: campaignId }),
                signal: AbortSignal.timeout(10000),
            });

            if (forecastResponse.ok) {
                forecastData = await forecastResponse.json();
                await createLogPayload(campaignId, 'FORECAST_ENGINE', forecastData);

                if (forecastData) {
                    await prisma.forecastLog.create({
                        data: {
                            campaignId,
                            predictedSpendExhaustionDate: forecastData.predictedSpendExhaustionDate
                                ? new Date(forecastData.predictedSpendExhaustionDate)
                                : null,
                            projectedBurnRate: forecastData.projectedBurnRate,
                            statisticalConfidenceRisk: forecastData.statisticalConfidenceRisk,
                            budgetRiskLevel: forecastData.budgetRiskLevel,
                            modelConfidence: forecastData.modelConfidence,
                        },
                    });
                }
            } else {
                console.warn(`[Forecast] Python service returned ${forecastResponse.status}. Continuing without forecast.`);
            }
        } catch (forecastError) {
            console.warn('[Forecast] Python forecast service unavailable. Continuing without forecast.', forecastError);
            await createLogPayload(campaignId, 'FORECAST_ENGINE', { status: 'unavailable', error: String(forecastError) });
        }
        await agentDelay();

        // ═══ Step B2: Memory Engine – Find Similar Campaigns (Phase 4) ═══
        const similarCampaigns = await findSimilarCampaigns(campaignId, normalized);
        await createLogPayload(campaignId, 'MEMORY_ENGINE', { similarCampaigns, totalProfilesChecked: true });
        await agentDelay();

        // ═══ Step B3: Fetch Collaboration Profile (Phase 5) ═══
        let collaborationInput: CollaborationInput | null = null
        try {
            const collab = await prisma.collaborationProfile.findUnique({
                where: { userId: campaign.userId },
            })
            if (collab) {
                collaborationInput = {
                    riskToleranceScore: collab.riskToleranceScore,
                    disagreementSuccessRate: collab.disagreementSuccessRate,
                    rejectRate: collab.rejectRate,
                    verbosityPreference: collab.verbosityPreference,
                }
            }
        } catch (collabErr) {
            console.warn('[Collaboration] Profile fetch failed, continuing without:', collabErr)
        }
        await createLogPayload(campaignId, 'COLLABORATION_PROFILE', collaborationInput ?? { status: 'none' })
        await agentDelay()

        // ═══ Step C: Structured Debate (Supervisor) ═══
        const debate = runDebate(
            signalProfile,
            forecastData,
            similarCampaigns,
            snapshotCount,
            collaborationInput,
        );

        // Log each debate round
        for (const round of debate.rounds) {
            await createLogPayload(campaignId, round.agent, round.output);
        }
        await agentDelay();

        // ═══ Step D2: Creative Intervention Engine (Phase 6) ═══
        const creativeSuggestions = generateCreativeInterventions(
            debate.synthesizerOutput,
            signalProfile,
            collaborationInput,
        );
        await createLogPayload(campaignId, 'CREATIVE_ENGINE', {
            cause: debate.synthesizerOutput.primaryCause,
            suggestionsGenerated: creativeSuggestions.length,
        });
        await agentDelay();

        // ═══ Step E: Store Results ═══
        await prisma.$transaction([
            // Store the debate as AgentDebate
            prisma.agentDebate.create({
                data: {
                    campaignId,
                    analystHypotheses: JSON.parse(JSON.stringify(debate.analystHypotheses)),
                    criticChallenge: JSON.parse(JSON.stringify(debate.criticChallenges)),
                    memoryRetrieval: JSON.parse(JSON.stringify(debate.memoryContext)),
                    synthesizerDecision: JSON.parse(JSON.stringify(debate.synthesizerOutput)),
                    debateLog: JSON.parse(JSON.stringify(debate.rounds)),
                },
            }),
            // Store backward-compatible AnalysisRun
            prisma.analysisRun.create({
                data: {
                    campaignId,
                    fatigueScore: fatigueContext.score,
                    confidenceScore: Math.round(debate.synthesizerOutput.confidence * 100),
                    severityLevel: debate.synthesizerOutput.severity,
                    suggestedAction: debate.synthesizerOutput.recommendedAction,
                    analysisOutput: JSON.stringify(analysisContext),
                    fatigueOutput: JSON.stringify(fatigueContext),
                    learningOutput: JSON.stringify(historicalContext),
                    decisionOutput: JSON.stringify(debate.synthesizerOutput),
                    recommendationOutput: JSON.stringify(debate.analystHypotheses),
                },
            }),
            // Store Synthesizer decision as RecommendationLog with PENDING status
            prisma.recommendationLog.create({
                data: {
                    campaignId,
                    interventionType: debate.synthesizerOutput.recommendedAction,
                    originalContent: JSON.stringify(debate.analystHypotheses),
                    recommendedContent: debate.synthesizerOutput.primaryCause,
                    explainabilityReasoning: JSON.stringify(debate),
                    status: 'PENDING',
                    outcomeStatus: 'PENDING',
                },
            }),
            // Store creative suggestions
            ...creativeSuggestions.map(s =>
                prisma.creativeSuggestion.create({
                    data: {
                        campaignId,
                        primaryCause: s.primaryCause,
                        suggestionType: s.suggestionType,
                        content: s.content,
                        explanation: s.explanation,
                        confidenceImpact: s.confidenceImpact,
                    },
                })
            ),
            // Update campaign status
            prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'DECISION_READY' },
            }),
        ]);

        console.log(`[Workflow Success] Campaign ${campaignId} Phase 6 pipeline completed. ${creativeSuggestions.length} creative suggestions generated.`);

    } catch (error) {
        console.error(`[Workflow Failed] Campaign ${campaignId}:`, error);

        try {
            await prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'FAILED' },
            });
            await createLogPayload(campaignId, 'WORKFLOW_ERROR', { error: String(error) });
        } catch (dbError) {
            console.error('Failed to update FAILED status:', dbError);
        }
    }
}
