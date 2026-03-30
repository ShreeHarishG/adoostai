import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

type Scenario = 'increase_budget_20' | 'reduce_spend_15' | 'extend_runtime_7'

function riskFromRunway(daysToExhaustion: number | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (daysToExhaustion == null) return 'MEDIUM'
  if (daysToExhaustion < 5) return 'HIGH'
  if (daysToExhaustion < 12) return 'MEDIUM'
  return 'LOW'
}

function toDateISO(daysFromNow: number | null): string | null {
  if (daysFromNow == null) return null
  const target = new Date()
  target.setDate(target.getDate() + Math.max(0, Math.round(daysFromNow)))
  return target.toISOString()
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser()
    const { id: campaignId } = await params
    const { scenario } = (await request.json()) as { scenario?: Scenario }

    const selectedScenario: Scenario = scenario || 'increase_budget_20'

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId, userId: user.id },
      include: {
        forecastLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const rawMetrics = JSON.parse(campaign.metrics || '{}') as {
      spend?: number
      durationDays?: number
    }

    const spent = rawMetrics.spend ?? 0
    const durationDays = Math.max(1, rawMetrics.durationDays ?? 14)
    const baseDailySpend = spent > 0 ? spent / durationDays : 100

    const baseBudget = campaign.totalBudget ?? Math.max(spent * 1.5, 500)
    const remaining = Math.max(0, baseBudget - spent)

    const latestForecast = campaign.forecastLogs[0]
    const forecastBurn = latestForecast?.projectedBurnRate ?? baseDailySpend
    const baselineDaysToExhaustion = forecastBurn > 0 ? remaining / forecastBurn : null

    let simulatedBudget = baseBudget
    let simulatedBurn = forecastBurn

    if (selectedScenario === 'increase_budget_20') {
      simulatedBudget = baseBudget * 1.2
      simulatedBurn = forecastBurn * 1.08
    }

    if (selectedScenario === 'reduce_spend_15') {
      simulatedBurn = forecastBurn * 0.85
    }

    if (selectedScenario === 'extend_runtime_7') {
      simulatedBudget = baseBudget + baseDailySpend * 7
      simulatedBurn = forecastBurn * 0.96
    }

    const simulatedRemaining = Math.max(0, simulatedBudget - spent)
    const simulatedDaysToExhaustion = simulatedBurn > 0 ? simulatedRemaining / simulatedBurn : null

    const baseRisk = riskFromRunway(baselineDaysToExhaustion)
    const simRisk = riskFromRunway(simulatedDaysToExhaustion)

    const riskShift =
      baseRisk === simRisk ? 'UNCHANGED' : simRisk === 'LOW' ? 'IMPROVED' : simRisk === 'HIGH' ? 'WORSENED' : 'MIXED'

    const burnRateChangePct =
      forecastBurn > 0 ? Number((((simulatedBurn - forecastBurn) / forecastBurn) * 100).toFixed(1)) : 0

    return NextResponse.json({
      scenario: selectedScenario,
      assumptions: {
        budget: Number(simulatedBudget.toFixed(2)),
        spent: Number(spent.toFixed(2)),
        remaining: Number(simulatedRemaining.toFixed(2)),
        burnRate: Number(simulatedBurn.toFixed(2)),
        daysToExhaustion: simulatedDaysToExhaustion == null ? null : Number(simulatedDaysToExhaustion.toFixed(1)),
        exhaustionDate: toDateISO(simulatedDaysToExhaustion),
        budgetRisk: simRisk,
      },
      delta: {
        burnRateChangePct,
        runwayChangeDays:
          baselineDaysToExhaustion == null || simulatedDaysToExhaustion == null
            ? null
            : Number((simulatedDaysToExhaustion - baselineDaysToExhaustion).toFixed(1)),
        riskShift,
      },
    })
  } catch (error) {
    console.error('[Simulation API] Error:', error)
    return NextResponse.json({ error: 'Failed to simulate campaign changes' }, { status: 500 })
  }
}

