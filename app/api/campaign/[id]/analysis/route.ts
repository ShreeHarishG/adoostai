import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser()
    const { id } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
      include: {
        signalProfiles: { orderBy: { computedAt: 'desc' }, take: 1 },
        forecastLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        agentDebates: { orderBy: { completedAt: 'desc' }, take: 1 },
        creativeSuggestions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const signal = campaign.signalProfiles[0] ?? null
    const forecast = campaign.forecastLogs[0] ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decision = (campaign.agentDebates[0]?.synthesizerDecision as any) ?? null

    return NextResponse.json({
      signalProfile: signal
        ? {
            ctrSlope: signal.ctrSlope,
            cpaSlope: signal.cpaAcceleration,
            impressionDecayRate: signal.impressionDecayRate,
            spendEfficiencySlope: signal.spendEfficiencySlope,
            engagementVolatility: signal.engagementVolatility,
            dataSufficiencyScore: signal.normalizedVolatility ?? 0,
          }
        : null,
      forecast: forecast
        ? {
            predictedSpendExhaustionDate: forecast.predictedSpendExhaustionDate,
            projectedBurnRate: forecast.projectedBurnRate,
            statisticalConfidenceRisk: forecast.statisticalConfidenceRisk,
            budgetRiskLevel: forecast.budgetRiskLevel,
            modelConfidence: forecast.modelConfidence,
          }
        : null,
      decision: decision
        ? {
            primaryCause: decision.primaryCause,
            severity: decision.severity,
            recommendedAction: decision.recommendedAction,
            confidence: decision.confidence,
            uncertainty: decision.uncertainty ?? 0,
          }
        : null,
      creativeSuggestions: campaign.creativeSuggestions.map((item) => ({
        primaryCause: item.primaryCause,
        suggestionType: item.suggestionType,
        content: item.content,
        explanation: item.explanation,
        confidenceImpact: item.confidenceImpact,
      })),
    })
  } catch (error) {
    console.error('[Analysis API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign analysis' }, { status: 500 })
  }
}
