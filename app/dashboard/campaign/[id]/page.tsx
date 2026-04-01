'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Brain,
  Check,
  Clock3,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Zap,
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

// ─── Types ──────────────────────────────────────────────

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

interface DebateEvent {
  step: string
  payload: string
  timestamp: string
}

// ─── Agent Metadata ─────────────────────────────────────

const AGENT_META: Record<string, { label: string; icon: typeof Bot; color: string; description: string }> = {
  ANALYSIS_AGENT: { label: 'Signal Analyst', icon: Search, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25', description: 'Decomposing raw performance metrics into diagnostic signals…' },
  FATIGUE_AGENT: { label: 'Fatigue Detector', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/25', description: 'Evaluating creative fatigue severity and trend acceleration…' },
  LEARNING_AGENT: { label: 'Learning Agent', icon: Brain, color: 'text-purple-400 bg-purple-500/10 border-purple-500/25', description: 'Analyzing historical decision patterns for context…' },
  SIGNAL_NORMALIZE: { label: 'Signal Normalizer', icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10 border-blue-500/25', description: 'Normalizing signals against historical campaign benchmarks…' },
  FORECAST_ENGINE: { label: 'Forecast Engine', icon: TrendingUp, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25', description: 'Running statistical budget models and burn rate projections…' },
  MEMORY_ENGINE: { label: 'Memory Retrieval', icon: Search, color: 'text-teal-400 bg-teal-500/10 border-teal-500/25', description: 'Searching for similar campaigns in the knowledge base…' },
  COLLABORATION_PROFILE: { label: 'Collaboration Profile', icon: MessageSquare, color: 'text-pink-400 bg-pink-500/10 border-pink-500/25', description: 'Loading user preference and risk tolerance model…' },
  ANALYST: { label: 'Analyst Agent', icon: Search, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25', description: 'Formulating hypotheses about campaign performance…' },
  CRITIC: { label: 'Critic Agent', icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/25', description: 'Challenging assumptions and stress-testing findings…' },
  MEMORY: { label: 'Memory Agent', icon: Brain, color: 'text-purple-400 bg-purple-500/10 border-purple-500/25', description: 'Retrieving relevant precedents and outcomes…' },
  SYNTHESIZER: { label: 'Synthesizer', icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', description: 'Synthesizing all evidence into a final recommendation…' },
  CREATIVE_ENGINE: { label: 'Creative Engine', icon: Sparkles, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25', description: 'Generating AI-powered creative interventions…' },
  N8N_WEBHOOK: { label: 'Automation', icon: Zap, color: 'text-orange-400 bg-orange-500/10 border-orange-500/25', description: 'Triggering external alerts and autonomous actions…' },
  WORKFLOW_ERROR: { label: 'Error', icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/25', description: 'An error occurred during processing.' },
}

const DEFAULT_AGENT = { label: 'Agent', icon: Bot, color: 'text-slate-400 bg-white/[0.06] border-white/[0.1]', description: 'Processing…' }

// ─── Helpers ────────────────────────────────────────────

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
  if (score >= 75) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
  if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/25'
  return 'text-red-400 bg-red-500/10 border-red-500/25'
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

// ─── Live Debate Panel Component ────────────────────────

function LiveDebatePanel({ campaignId, onComplete }: { campaignId: string; onComplete: () => void }) {
  const [events, setEvents] = useState<DebateEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [finalStatus, setFinalStatus] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const eventSource = new EventSource(`/api/campaigns/${campaignId}/stream`)

    eventSource.onopen = () => setIsConnected(true)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'complete') {
          setFinalStatus(data.status)
          eventSource.close()
          setIsConnected(false)
          // Give a moment to see the final state, then reload
          setTimeout(onComplete, 1500)
          return
        }

        if (data.type === 'log') {
          setEvents((prev) => {
            // Avoid duplicates
            const exists = prev.some((e) => e.step === data.step && e.timestamp === data.timestamp)
            if (exists) return prev
            return [...prev, { step: data.step, payload: data.payload, timestamp: data.timestamp }]
          })
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
    }

    return () => eventSource.close()
  }, [campaignId, onComplete])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Live Agent Debate</h2>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && !finalStatus && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live
            </span>
          )}
          {finalStatus && (
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              finalStatus === 'FAILED'
                ? 'border-red-500/25 bg-red-500/10 text-red-400'
                : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
            }`}>
              {finalStatus === 'FAILED' ? 'Failed' : 'Complete'}
            </span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[500px] overflow-y-auto p-4">
        {events.length === 0 && !finalStatus && (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-400" />
              <p className="mt-3 text-sm font-medium text-slate-300">Waiting for agents to start…</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {events.map((event, index) => {
            const meta = AGENT_META[event.step] || DEFAULT_AGENT
            const Icon = meta.icon
            return (
              <div
                key={`${event.step}-${index}`}
                className="rise-in flex items-start gap-3"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold text-white">{meta.label}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{meta.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 p-1">
                  <Check className="h-3 w-3 text-emerald-400" />
                </span>
              </div>
            )
          })}

          {isConnected && !finalStatus && events.length > 0 && (
            <div className="flex items-start gap-3 opacity-60">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04]">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Next agent thinking…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────

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

  const isAnalyzing = data?.campaign?.status === 'ANALYZING'

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

  // ─── Loading / Error States ─────────────────────────────

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="surface-card px-8 py-6 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-400" />
          <p className="mt-3 text-sm font-medium text-slate-300">Loading campaign intelligence…</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="surface-card max-w-md p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm font-semibold text-white">{error || 'Unknown error'}</p>
          <button onClick={fetchData} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500">
            Retry
          </button>
        </div>
      </main>
    )
  }

  // ─── Page ───────────────────────────────────────────────

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      {/* ─── Hero Header ──────────────────────── */}
      <section className="top-gradient rise-in rounded-2xl p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold">{data.campaign.platform.toUpperCase()} Campaign Intelligence</h1>
            <p className="mt-2 text-sm text-white/80">Health score, explainability timeline, live debate, and ranked actions.</p>
          </div>
          <div className={`rounded-2xl border px-5 py-3 text-center ${getHealthTone(healthScore)}`}>
            <p className="text-xs font-semibold uppercase tracking-widest">Health</p>
            <p className="text-3xl font-bold">{healthScore}</p>
          </div>
        </div>
      </section>

      {/* ─── Live Debate (only when ANALYZING) ── */}
      {isAnalyzing && (
        <section className="rise-in">
          <LiveDebatePanel campaignId={campaignId} onComplete={fetchData} />
        </section>
      )}

      {/* ─── Stat Cards ───────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Signal Health</p>
          <p className="mt-2 text-2xl font-bold text-white">{data.latestRun ? Math.round(100 - data.latestRun.fatigueScore) : 0}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Forecast Risk</p>
          <p className="mt-2 text-2xl font-bold text-white">{data.latestForecast?.budgetRiskLevel || 'N/A'}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Data Sufficiency</p>
          <p className="mt-2 text-2xl font-bold text-white">{Math.min(100, data.fatigueTrend.length * 20)}%</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Decision Confidence</p>
          <p className="mt-2 text-2xl font-bold text-white">{Math.round(data.latestRun?.confidenceScore || 0)}%</p>
        </article>
      </section>

      {/* ─── Chart + Signal ───────────────────── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="surface-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Trend Graph</h2>
            <span className="text-xs text-slate-500">CTR and spend over time</span>
          </div>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-400">No performance snapshots yet. Import data to populate trends.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F1F5F9' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="ctr" stroke="#6366F1" name="CTR (%)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#10B981" name="Spend ($)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-white">Signal Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-400">CTR trend: <span className="font-semibold text-white">{chartData.length > 1 && chartData[chartData.length - 1].ctr < chartData[0].ctr ? 'Declining' : 'Stable'}</span></p>
            <p className="text-slate-400">Spend trend: <span className="font-semibold text-white">{chartData.length > 1 && chartData[chartData.length - 1].spend > chartData[0].spend ? 'Rising' : 'Stable'}</span></p>
            <p className="text-slate-400">Impression decay: <span className="font-semibold text-white">{data.hasFatigueAcceleration ? 'Moderate' : 'Low'}</span></p>
            <p className="text-slate-400">Data confidence: <span className="font-semibold text-white">{data.latestRun?.confidenceScore ? (data.latestRun.confidenceScore > 70 ? 'High' : 'Medium') : 'Low'}</span></p>
          </div>
        </article>
      </section>

      {/* ─── Timeline + Actions ───────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Explainability Timeline</h2>
          </div>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={`${event.title}-${index}`} className="flex gap-3">
                <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{event.date}</p>
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <p className="text-sm text-slate-400">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Action Priority Ranking</h2>
          </div>
          <div className="space-y-3">
            {rankedActions.map((item) => (
              <div key={item.priority} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Priority {item.priority}</p>
                <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.reason}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ─── Simulation + Decisions ───────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">One-Click Simulation</h2>
          </div>
          <p className="text-sm text-slate-400">Test scenarios before changing spend in the ad platform.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => runSimulation('increase_budget_20')} className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.08]">Increase budget +20%</button>
            <button onClick={() => runSimulation('reduce_spend_15')} className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.08]">Reduce spend -15%</button>
            <button onClick={() => runSimulation('extend_runtime_7')} className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.08]">Extend runtime +7d</button>
          </div>

          {simLoading && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Simulating…</p>
          )}

          {simulation && (
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">Scenario: {simulation.scenario.replaceAll('_', ' ')}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <p className="text-slate-400">Burn rate: <span className="font-semibold text-white">${simulation.assumptions.burnRate.toFixed(2)}/day</span></p>
                <p className="text-slate-400">Risk: <span className="font-semibold text-white">{simulation.assumptions.budgetRisk}</span></p>
                <p className="text-slate-400">Runway delta: <span className="font-semibold text-white">{simulation.delta.runwayChangeDays == null ? 'N/A' : `${simulation.delta.runwayChangeDays} days`}</span></p>
                <p className="text-slate-400">Exhaustion date: <span className="font-semibold text-white">{formatDate(simulation.assumptions.exhaustionDate)}</span></p>
              </div>
            </div>
          )}
        </article>

        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-white">Decision & Suggestions</h2>
          {data.latestRecommendation && data.latestRecommendation.status === 'PENDING' && !data.latestRecommendation.userResponse ? (
            <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
              <p className="text-sm font-semibold text-white">Pending recommendation</p>
              <p className="mt-1 text-sm text-slate-300">{data.latestRecommendation.interventionType}: {data.latestRecommendation.recommendedContent}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => submitDecision('ACCEPTED')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500">Accept</button>
                <button onClick={() => submitDecision('REJECTED')} className="rounded-lg bg-red-600/80 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500">Reject</button>
                <button onClick={() => submitDecision('MODIFIED')} className="rounded-lg bg-amber-600/80 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500">Modify</button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No pending recommendation requiring action.</p>
          )}

          <div className="mt-5 space-y-3">
            {creativeSuggestions.length === 0 && (
              <p className="text-sm text-slate-400">No creative suggestions available.</p>
            )}
            {creativeSuggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{suggestion.suggestionType}</p>
                <p className="mt-1 text-sm font-semibold text-white">{suggestion.content}</p>
                <p className="mt-1 text-xs text-slate-400">{suggestion.explanation}</p>
                {!suggestion.applied ? (
                  <button onClick={() => markSuggestionApplied(suggestion.id)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08]">
                    <Check className="h-3.5 w-3.5" /> Mark applied
                  </button>
                ) : (
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /> Applied</p>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ─── Bottom Row ───────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-white">Financial Intelligence</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-400">Burn rate: <span className="font-semibold text-white">{data.latestForecast?.projectedBurnRate ? `$${data.latestForecast.projectedBurnRate.toFixed(2)}` : 'N/A'}</span></p>
            <p className="text-slate-400">Exhaustion date: <span className="font-semibold text-white">{formatDate(data.latestForecast?.predictedSpendExhaustionDate)}</span></p>
            <p className="text-slate-400">Statistical risk: <span className="font-semibold text-white">{data.latestForecast?.statisticalConfidenceRisk || 'N/A'}</span></p>
          </div>
        </article>
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-white">AI Decision</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-400">Primary cause: <span className="font-semibold text-white">{data.latestRun?.suggestedAction || 'N/A'}</span></p>
            <p className="text-slate-400">Severity: <span className="font-semibold text-white">{data.latestRun?.severityLevel || 'N/A'}</span></p>
            <p className="text-slate-400">Confidence: <span className="font-semibold text-white">{data.latestRun?.confidenceScore ? `${data.latestRun.confidenceScore}%` : 'N/A'}</span></p>
          </div>
          {data.hasFatigueAcceleration && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400">
              <TriangleAlert className="h-4 w-4" /> Fatigue acceleration detected.
            </p>
          )}
        </article>
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold text-white">Creative Content</h2>
          {data.creativeContent ? (
            <div className="mt-4 space-y-3 text-sm">
              {data.creativeContent.thumbnailUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.creativeContent.thumbnailUrl} alt="Instagram thumbnail" className="w-full rounded-lg border border-white/[0.08] object-cover" />
                </>
              )}
              <p className="font-semibold text-white">{data.creativeContent.mediaType}</p>
              <p className="text-slate-400">{data.creativeContent.caption}</p>
              {Array.isArray(data.creativeContent.hashtags) && data.creativeContent.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.creativeContent.hashtags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-xs text-slate-300">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No Instagram content imported yet.</p>
          )}
        </article>
      </section>

      {/* ─── Similar Campaigns ────────────────── */}
      <section className="surface-card p-6">
        <h2 className="text-lg font-bold text-white">Similar Campaigns</h2>
        {similarCampaigns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No similar campaigns found yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {similarCampaigns.map((item) => (
              <div key={item.campaignId} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm">
                <p className="font-semibold text-white">{item.campaignId.slice(0, 12)}</p>
                <p className="text-slate-400">Similarity: <span className="font-semibold text-white">{(1 - item.similarityScore).toFixed(2)}</span></p>
                <p className="text-slate-400">Status: <span className="font-semibold text-white">{item.outcomeStatus}</span></p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
