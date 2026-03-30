'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, BarChart3, Clock3, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'

interface DashboardStats {
  totalCampaigns: number
  totalAnalyses: number
  avgFatigue: number
  severeCampaigns: number
  severityPercent: number
  overrideRate: number
  campaignsWithRuns: number
}

interface CampaignRow {
  id: string
  platform: string
  adType: string | null
  status: string
  createdAt: string
  updatedAt: string
  latestRun: {
    id: string
    fatigueScore: number
    confidenceScore: number
    severityLevel: string
    suggestedAction: string
    createdAt: string
  } | null
  totalDecisions: number
  lastDecision: string | null
}

interface DashboardData {
  stats: DashboardStats
  campaigns: CampaignRow[]
}

function scoreRisk(level?: string): number {
  if (!level) return 55
  if (level === 'CRITICAL' || level === 'HIGH') return 80
  if (level === 'MEDIUM') return 55
  return 30
}

function healthFromCampaign(campaign: CampaignRow): number {
  if (!campaign.latestRun) return 50
  const signalHealth = 100 - Math.min(100, campaign.latestRun.fatigueScore)
  const confidenceHealth = campaign.latestRun.confidenceScore
  const riskHealth = 100 - scoreRisk(campaign.latestRun.severityLevel)
  return Math.round(signalHealth * 0.45 + confidenceHealth * 0.35 + riskHealth * 0.2)
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    PAUSE: 'Pause campaign',
    REFRESH: 'Refresh creative',
    TEST: 'Run new variant test',
    CONTINUE: 'Continue and monitor',
  }
  return map[action] || action
}

function statusTone(status: string): string {
  if (status === 'FAILED') return 'text-red-700 bg-red-100 border-red-200'
  if (status === 'ANALYZING') return 'text-blue-700 bg-blue-100 border-blue-200'
  if (status === 'DECISION_READY' || status === 'AWAITING_USER_ACTION') return 'text-amber-700 bg-amber-100 border-amber-200'
  if (status === 'COMPLETED') return 'text-emerald-700 bg-emerald-100 border-emerald-200'
  return 'text-slate-700 bg-slate-100 border-slate-200'
}

function severityTone(level?: string): string {
  if (level === 'CRITICAL') return 'text-red-700 bg-red-100'
  if (level === 'HIGH') return 'text-orange-700 bg-orange-100'
  if (level === 'MEDIUM') return 'text-amber-700 bg-amber-100'
  if (level === 'LOW') return 'text-emerald-700 bg-emerald-100'
  return 'text-slate-600 bg-slate-100'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const liveAnalyzing = useMemo(() => data?.campaigns.some((c) => c.status === 'ANALYZING') ?? false, [data])

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="surface-card px-8 py-6 text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-700">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="surface-card max-w-md p-6 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-red-600" />
          <p className="mt-3 text-sm font-semibold text-slate-900">{error || 'Unknown error'}</p>
          <button onClick={fetchDashboard} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Retry
          </button>
        </div>
      </main>
    )
  }

  const { stats, campaigns } = data

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="top-gradient rise-in rounded-3xl p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
              <Sparkles className="h-3.5 w-3.5" /> Product Intelligence
            </p>
            <h1 className="mt-3 text-3xl font-bold">Campaign Command Center</h1>
            <p className="mt-2 text-sm text-white/90">Track risk, confidence, and decision readiness across all campaigns.</p>
          </div>
          <div className="flex items-center gap-2">
            {liveAnalyzing && <span className="rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-semibold">Live analysis running</span>}
            <button onClick={fetchDashboard} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <Link href="/dashboard/import" className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white">
              Import Data
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white">
              New Analysis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Campaigns</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{stats.totalCampaigns}</p>
          <p className="mt-1 text-xs text-slate-500">{stats.totalAnalyses} analyses processed</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Avg Fatigue</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{stats.avgFatigue}<span className="ml-1 text-base text-slate-500">/100</span></p>
          <p className="mt-1 text-xs text-slate-500">Lower is healthier</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">High Risk</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{stats.severeCampaigns}</p>
          <p className="mt-1 text-xs text-slate-500">{stats.severityPercent}% of campaigns</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Override Rate</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{stats.overrideRate}%</p>
          <p className="mt-1 text-xs text-slate-500">Decision disagreement indicator</p>
        </article>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Campaign Portfolio</h2>
          <p className="text-xs text-slate-500">{campaigns.length} total</p>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-10 text-center">
            <BarChart3 className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-900">No campaigns yet</p>
            <p className="mt-1 text-xs text-slate-500">Run your first analysis to populate the dashboard.</p>
            <Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Start Analysis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Health</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Action Priority</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const health = healthFromCampaign(campaign)
                  return (
                    <tr key={campaign.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/campaign/${campaign.id}`} className="font-semibold text-slate-900 hover:text-blue-700">
                          {campaign.platform.toUpperCase()} · {campaign.adType || 'General'}
                        </Link>
                        <p className="mt-1 font-mono text-xs text-slate-500">{campaign.id.slice(0, 12)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-32">
                          <div className="mb-1 flex justify-between text-xs text-slate-600">
                            <span>Score</span>
                            <span className="font-semibold text-slate-900">{health}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200">
                            <div className={`h-2 rounded-full ${health >= 75 ? 'bg-emerald-500' : health >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${health}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityTone(campaign.latestRun?.severityLevel)}`}>
                          {campaign.latestRun?.severityLevel || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {campaign.latestRun ? actionLabel(campaign.latestRun.suggestedAction) : 'Pending analysis'}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-700">
                        {campaign.latestRun ? `${campaign.latestRun.confidenceScore}%` : 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {campaign.latestRun ? timeAgo(campaign.latestRun.createdAt) : timeAgo(campaign.updatedAt)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card p-5">
          <h3 className="text-lg font-bold text-slate-900">Portfolio Notes</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" /> Campaigns with low health should be reviewed before additional spend.</li>
            <li className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 text-blue-600" /> Confidence below 60% suggests data insufficiency; avoid irreversible changes.</li>
          </ul>
        </article>
        <article className="surface-card p-5">
          <h3 className="text-lg font-bold text-slate-900">Next Step</h3>
          <p className="mt-3 text-sm text-slate-600">Open a campaign to review the Phase 7 explainability timeline and simulate budget changes in one click.</p>
          <Link href={campaigns[0] ? `/dashboard/campaign/${campaigns[0].id}` : '/'} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Open Campaign Detail <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>
    </main>
  )
}

