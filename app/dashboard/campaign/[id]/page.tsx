'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock3,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface FatigueTrendPoint {
  runIndex: number
  fatigueScore: number
  confidenceScore: number
  severityLevel: string
  suggestedAction: string
  timestamp: string
}

interface AgentTimelineEntry {
  step: string
  timestamp: string
  payload: Record<string, unknown>
}

interface ForecastData {
  predictedSpendExhaustionDate: string | null
  projectedBurnRate: number | null
  statisticalConfidenceRisk: string
  budgetRiskLevel: string
  modelConfidence: string
  createdAt: string
}

interface SimilarCampaignData {
  campaignId: string
  similarityScore: number
  finalDecision: string
  outcomeStatus: string
}

interface CreativeSuggestion {
  id: string
  primaryCause: string
  suggestionType: 'HEADLINE' | 'CTA' | 'REFRAME' | 'STRUCTURAL'
  content: string
  explanation: string
  confidenceImpact: number
  applied: boolean
  createdAt: string
}

interface IntelligenceData {
  campaign: {
    id: string
    platform: string
    adType: string | null
    status: string
    createdAt: string
    updatedAt: string
  }
  snapshotSeries: {
    date: string
    impressions: number
    clicks: number
    spend: number
    conversions: number
    ctr: number
    reach?: number | null
    frequency?: number | null
  }[]
  fatigueTrend: FatigueTrendPoint[]
  hasFatigueAcceleration: boolean
  agentTimeline: AgentTimelineEntry[]
  learningBias: {
    totalDecisions: number
    pauseCount: number
    refreshCount: number
    avgFatigueAtPause: number
    avgFatigueAtContinue: number
    overrideRate: number
    systemPauseCount: number
    userIgnoredPause: number
  }
  decisionConsistency: {
    score: number
    totalDecisions: number
    alignedCount: number
    overrideCount: number
  }
  latestRun: {
    fatigueScore: number
    confidenceScore: number
    severityLevel: string
    suggestedAction: string
    recommendationOutput?: string
    createdAt: string
  } | null
  latestForecast: ForecastData | null
  similarCampaigns: SimilarCampaignData[]
  creativeSuggestions: CreativeSuggestion[]
  creativeContent: {
    id: string
    caption: string
    hashtags: string[]
    mediaType: string
    thumbnailUrl: string | null
    createdAt: string
  } | null
  collaborationProfile: {
    riskToleranceScore: number
    disagreementSuccessRate: number
    acceptRate: number
    rejectRate: number
    overrideRate: number
    verbosityPreference: string
  } | null
  latestRecommendation: {
    id: string
    interventionType: string
    recommendedContent: string
    status: string
    userResponse: string | null
  } | null
}

interface SimulationData {
  scenario: string
  assumptions: {
    budget: number
    spent: number
    remaining: number
    burnRate: number
    daysToExhaustion: number | null
    exhaustionDate: string | null
    budgetRisk: string
  }
  delta: {
    burnRateChangePct: number
    runwayChangeDays: number | null
    riskShift: string
  }
}

interface RankedAction {
  priority: number
  title: string
  reason: string
}

function riskToScore(level?: string): number {
  if (!level) return 50
  if (level === 'HIGH' || level === 'CRITICAL') return 85
  if (level === 'MEDIUM') return 55
  return 25
}

function getHealthScore(data: IntelligenceData): number {
  const signalHealth = data.latestRun ? 100 - Math.min(100, data.latestRun.fatigueScore) : 45
  const forecastHealth = data.latestForecast ? 100 - riskToScore(data.latestForecast.budgetRiskLevel) : 55
  const dataSufficiency = Math.min(100, data.fatigueTrend.length * 20)
  const decisionConfidence = data.latestRun?.confidenceScore ?? 45
  return Math.round(signalHealth * 0.35 + forecastHealth * 0.25 + dataSufficiency * 0.2 + decisionConfidence * 0.2)
}

function getHealthTone(score: number): string {
  if (score >= 75) return 'text-emerald-700 bg-emerald-100 border-emerald-200'
  if (score >= 50) return 'text-amber-700 bg-amber-100 border-amber-200'
  return 'text-red-700 bg-red-100 border-red-200'
}

function actionFromSuggestion(action?: string): string {
  if (!action) return 'Continue and monitor'
  if (action === 'PAUSE') return 'Pause campaign spend'
  if (action === 'REFRESH') return 'Refresh creative assets'
  if (action === 'TEST') return 'Run A/B variant test'
  return 'Continue and monitor'
}

function buildTimeline(data: IntelligenceData): { title: string; date: string; detail: string }[] {
  const events: { title: string; date: string; detail: string }[] = []

  if (data.fatigueTrend.length > 0) {
    const first = data.fatigueTrend[0]
    events.push({
      title: 'Initial signal observed',
      date: new Date(first.timestamp).toLocaleDateString('en-US'),
      detail: `Fatigue score ${Math.round(first.fatigueScore)} with action ${actionFromSuggestion(first.suggestedAction)}.`,
    })
  }

  if (data.fatigueTrend.length > 1) {
    const recent = data.fatigueTrend[data.fatigueTrend.length - 1]
    events.push({
      title: 'Trend update',
      date: new Date(recent.timestamp).toLocaleDateString('en-US'),
      detail: `Current fatigue ${Math.round(recent.fatigueScore)} and confidence ${Math.round(recent.confidenceScore)}%.`,
    })
  }

  if (data.latestForecast?.budgetRiskLevel) {
    events.push({
      title: 'Forecast risk evaluated',
      date: new Date(data.latestForecast.createdAt).toLocaleDateString('en-US'),
      detail: `Budget risk marked as ${data.latestForecast.budgetRiskLevel}.`,
    })
  }

  const criticalAgentStep = data.agentTimeline.find((entry) => entry.step === 'SYNTHESIZER' || entry.step === 'CRITIC')
  if (criticalAgentStep) {
    events.push({
      title: 'Reasoning finalized',
      date: new Date(criticalAgentStep.timestamp).toLocaleDateString('en-US'),
      detail: `Multi-agent synthesis completed at ${criticalAgentStep.step}.`,
    })
  }

  return events
}

function rankActions(data: IntelligenceData): RankedAction[] {
  const ranked: RankedAction[] = []
  const suggestions = Array.isArray(data.creativeSuggestions) ? data.creativeSuggestions : []

  if (data.latestRun) {
    ranked.push({
      priority: 1,
      title: actionFromSuggestion(data.latestRun.suggestedAction),
      reason: `Primary system decision with ${Math.round(data.latestRun.confidenceScore)}% confidence.`,
    })
  }

  if (data.latestForecast && data.latestForecast.budgetRiskLevel !== 'LOW') {
    ranked.push({
      priority: ranked.length + 1,
      title: 'Rebalance spend pace',
      reason: `Forecast indicates ${data.latestForecast.budgetRiskLevel.toLowerCase()} budget risk.`,
    })
  }

  const firstCreative = [...suggestions]
    .sort((a, b) => b.confidenceImpact - a.confidenceImpact)
    .find((item) => !item.applied)

  if (firstCreative) {
    ranked.push({
      priority: ranked.length + 1,
      title: `Apply ${firstCreative.suggestionType.toLowerCase()} improvement`,
      reason: firstCreative.content,
    })
  }

  if (ranked.length === 0) {
    ranked.push({
      priority: 1,
      title: 'Collect more data',
      reason: 'No confident recommendation yet. Run additional analysis cycles.',
    })
  }

  return ranked.slice(0, 3)
}

function formatDate(date?: string | null): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>()
  const campaignId = params.id

  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [simLoading, setSimLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/campaigns/${campaignId}/intelligence`)
      if (!res.ok) throw new Error('Failed to fetch campaign intelligence')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError('Failed to load campaign intelligence')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const healthScore = useMemo(() => (data ? getHealthScore(data) : 0), [data])
  const timeline = useMemo(() => (data ? buildTimeline(data) : []), [data])
  const rankedActions = useMemo(() => (data ? rankActions(data) : []), [data])
  const creativeSuggestions = useMemo(
    () => (data && Array.isArray(data.creativeSuggestions) ? data.creativeSuggestions : []),
    [data],
  )
  const similarCampaigns = useMemo(
    () => (data && Array.isArray(data.similarCampaigns) ? data.similarCampaigns : []),
    [data],
  )
  const chartData = useMemo(() => {
    if (!data) return []
    return data.snapshotSeries.map((point) => ({
      ...point,
      label: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
  }, [data])

  const runSimulation = async (scenario: string) => {
    try {
      setSimLoading(true)
      const res = await fetch(`/api/campaigns/${campaignId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })
      if (!res.ok) throw new Error('Simulation failed')
      const json = await res.json()
      setSimulation(json)
    } catch (err) {
      console.error(err)
    } finally {
      setSimLoading(false)
    }
  }

  const submitDecision = async (userResponse: 'ACCEPTED' | 'REJECTED' | 'MODIFIED') => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userResponse }),
      })
      if (!res.ok) throw new Error('Failed decision submit')
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const markSuggestionApplied = async (suggestionId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/suggestions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId }),
      })
      if (!res.ok) throw new Error('Failed update')
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="surface-card px-8 py-6 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-700">Loading campaign intelligence...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="surface-card max-w-md p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-3 text-sm font-semibold text-slate-900">{error || 'Unknown error'}</p>
          <button onClick={fetchData} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="top-gradient rounded-3xl p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold">{data.campaign.platform.toUpperCase()} campaign intelligence</h1>
            <p className="mt-2 text-sm text-white/90">Phase 7 view: score, explainability timeline, ranked actions, and impact simulation.</p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-center ${getHealthTone(healthScore)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.1em]">Health score</p>
            <p className="text-3xl font-bold">{healthScore}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Signal health</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data.latestRun ? Math.round(100 - data.latestRun.fatigueScore) : 0}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Forecast risk</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data.latestForecast?.budgetRiskLevel || 'N/A'}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Data sufficiency</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{Math.min(100, data.fatigueTrend.length * 20)}%</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Decision confidence</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(data.latestRun?.confidenceScore || 0)}%</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="surface-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Trend graph</h2>
            <span className="text-xs text-slate-500">CTR and spend over time</span>
          </div>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-600">No performance snapshots yet. Import data to populate trends.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="ctr" stroke="#2563eb" name="CTR (%)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#0f766e" name="Spend ($)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-slate-900">Signal summary</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>CTR trend: <span className="font-semibold text-slate-900">{chartData.length > 1 && chartData[chartData.length - 1].ctr < chartData[0].ctr ? 'Declining' : 'Stable'}</span></p>
            <p>Spend trend: <span className="font-semibold text-slate-900">{chartData.length > 1 && chartData[chartData.length - 1].spend > chartData[0].spend ? 'Rising' : 'Stable'}</span></p>
            <p>Impression decay: <span className="font-semibold text-slate-900">{data.hasFatigueAcceleration ? 'Moderate' : 'Low'}</span></p>
            <p>Data confidence: <span className="font-semibold text-slate-900">{data.latestRun?.confidenceScore ? (data.latestRun.confidenceScore > 70 ? 'High' : 'Medium') : 'Low'}</span></p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">Explainability timeline</h2>
          </div>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={`${event.title}-${index}`} className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{event.date}</p>
                  <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-600">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">Action priority ranking</h2>
          </div>
          <div className="space-y-3">
            {rankedActions.map((item) => (
              <div key={item.priority} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Priority {item.priority}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">One-click simulation</h2>
          </div>
          <p className="text-sm text-slate-600">Test scenarios before changing spend in the ad platform.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => runSimulation('increase_budget_20')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Increase budget +20%</button>
            <button onClick={() => runSimulation('reduce_spend_15')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Reduce spend -15%</button>
            <button onClick={() => runSimulation('extend_runtime_7')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Extend runtime +7d</button>
          </div>

          {simLoading && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Simulating...</p>
          )}

          {simulation && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Scenario: {simulation.scenario.replaceAll('_', ' ')}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <p className="text-slate-600">Burn rate: <span className="font-semibold text-slate-900">${simulation.assumptions.burnRate.toFixed(2)}/day</span></p>
                <p className="text-slate-600">Risk: <span className="font-semibold text-slate-900">{simulation.assumptions.budgetRisk}</span></p>
                <p className="text-slate-600">Runway delta: <span className="font-semibold text-slate-900">{simulation.delta.runwayChangeDays == null ? 'N/A' : `${simulation.delta.runwayChangeDays} days`}</span></p>
                <p className="text-slate-600">Exhaustion date: <span className="font-semibold text-slate-900">{formatDate(simulation.assumptions.exhaustionDate)}</span></p>
              </div>
            </div>
          )}
        </article>

        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-slate-900">Decision and suggestions</h2>
          {data.latestRecommendation && data.latestRecommendation.status === 'PENDING' && !data.latestRecommendation.userResponse ? (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Pending recommendation</p>
              <p className="mt-1 text-sm text-slate-600">{data.latestRecommendation.interventionType}: {data.latestRecommendation.recommendedContent}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => submitDecision('ACCEPTED')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Accept</button>
                <button onClick={() => submitDecision('REJECTED')} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">Reject</button>
                <button onClick={() => submitDecision('MODIFIED')} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white">Modify</button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No pending recommendation requiring action.</p>
          )}

          <div className="mt-5 space-y-3">
            {creativeSuggestions.length === 0 && (
              <p className="text-sm text-slate-600">No creative suggestions available.</p>
            )}
            {creativeSuggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{suggestion.suggestionType}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{suggestion.content}</p>
                <p className="mt-1 text-xs text-slate-600">{suggestion.explanation}</p>
                {!suggestion.applied ? (
                  <button onClick={() => markSuggestionApplied(suggestion.id)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                    <Check className="h-3.5 w-3.5" /> Mark applied
                  </button>
                ) : (
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Applied</p>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-slate-900">Financial intelligence</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>Burn rate: <span className="font-semibold text-slate-900">{data.latestForecast?.projectedBurnRate ? `$${data.latestForecast.projectedBurnRate.toFixed(2)}` : 'N/A'}</span></p>
            <p>Exhaustion date: <span className="font-semibold text-slate-900">{formatDate(data.latestForecast?.predictedSpendExhaustionDate)}</span></p>
            <p>Statistical risk: <span className="font-semibold text-slate-900">{data.latestForecast?.statisticalConfidenceRisk || 'N/A'}</span></p>
          </div>
        </article>
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-slate-900">AI decision</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>Primary cause: <span className="font-semibold text-slate-900">{data.latestRun?.suggestedAction || 'N/A'}</span></p>
            <p>Severity: <span className="font-semibold text-slate-900">{data.latestRun?.severityLevel || 'N/A'}</span></p>
            <p>Confidence: <span className="font-semibold text-slate-900">{data.latestRun?.confidenceScore ? `${data.latestRun.confidenceScore}%` : 'N/A'}</span></p>
          </div>
          {data.hasFatigueAcceleration && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              <TriangleAlert className="h-4 w-4" /> Fatigue acceleration detected.
            </p>
          )}
        </article>
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-slate-900">Creative content preview</h2>
          {data.creativeContent ? (
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {data.creativeContent.thumbnailUrl && (
                <img src={data.creativeContent.thumbnailUrl} alt="Instagram thumbnail" className="w-full rounded-lg border border-slate-200 object-cover" />
              )}
              <p className="font-semibold text-slate-900">{data.creativeContent.mediaType}</p>
              <p className="text-slate-600">{data.creativeContent.caption}</p>
              {Array.isArray(data.creativeContent.hashtags) && data.creativeContent.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.creativeContent.hashtags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No Instagram content imported yet.</p>
          )}
        </article>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-lg font-bold text-slate-900">Similar campaigns</h2>
        {similarCampaigns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No similar campaigns found yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {similarCampaigns.map((item) => (
              <div key={item.campaignId} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{item.campaignId.slice(0, 12)}</p>
                <p>Similarity: <span className="font-semibold text-slate-900">{(1 - item.similarityScore).toFixed(2)}</span></p>
                <p>Status: <span className="font-semibold text-slate-900">{item.outcomeStatus}</span></p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

