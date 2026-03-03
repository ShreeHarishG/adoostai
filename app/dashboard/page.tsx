'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Sparkles,
    Loader2,
    BarChart3,
    AlertTriangle,
    Activity,
    Target,
    TrendingUp,
    Zap,
    ArrowRight,
    RefreshCw,
    Clock,
    Shield,
    Link2,
    X,
} from 'lucide-react'

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

function getSeverityColor(level: string) {
    switch (level) {
        case 'CRITICAL': return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' }
        case 'HIGH': return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' }
        case 'MEDIUM': return { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400' }
        case 'LOW': return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' }
        default: return { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-400' }
    }
}

function getActionLabel(action: string) {
    switch (action) {
        case 'PAUSE': return { label: 'Pause', icon: '⏸', color: 'text-red-400' }
        case 'REFRESH': return { label: 'Refresh Creative', icon: '🔄', color: 'text-blue-400' }
        case 'TEST': return { label: 'Test Variants', icon: '🧪', color: 'text-purple-400' }
        case 'CONTINUE': return { label: 'Continue', icon: '✅', color: 'text-emerald-400' }
        default: return { label: action, icon: '—', color: 'text-gray-400' }
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'DRAFT': return { label: 'Draft', color: 'bg-gray-500/20 text-gray-400' }
        case 'ANALYZING': return { label: 'Analyzing', color: 'bg-blue-500/20 text-blue-400' }
        case 'DECISION_READY': return { label: 'Decision Ready', color: 'bg-amber-500/20 text-amber-400' }
        case 'AWAITING_USER_ACTION': return { label: 'Awaiting Action', color: 'bg-purple-500/20 text-purple-400' }
        case 'COMPLETED': return { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400' }
        case 'FAILED': return { label: 'Failed', color: 'bg-red-500/20 text-red-400' }
        default: return { label: status, color: 'bg-gray-500/20 text-gray-400' }
    }
}

function FatigueGauge({ score }: { score: number }) {
    const clampedScore = Math.min(100, Math.max(0, score))
    const color = clampedScore >= 80 ? 'text-red-400' : clampedScore >= 60 ? 'text-orange-400' : clampedScore >= 40 ? 'text-yellow-400' : 'text-emerald-400'
    const barColor = clampedScore >= 80 ? 'bg-red-400' : clampedScore >= 60 ? 'bg-orange-400' : clampedScore >= 40 ? 'bg-yellow-400' : 'bg-emerald-400'

    return (
        <div className="flex items-center gap-2.5 min-w-[120px]">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${clampedScore}%` }}
                />
            </div>
            <span className={`text-sm font-mono font-semibold tabular-nums ${color}`}>
                {clampedScore}
            </span>
        </div>
    )
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
    const [isPolling, setIsPolling] = useState(false)
    const [showConnectModal, setShowConnectModal] = useState(false)
    const [connectPlatform, setConnectPlatform] = useState<string | null>(null)

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

    // ── Smart Polling: only when campaigns are ANALYZING ──
    useEffect(() => {
        if (!data) return

        const hasAnalyzing = data.campaigns.some(c => c.status === 'ANALYZING')
        if (!hasAnalyzing) {
            setIsPolling(false)
            return
        }

        setIsPolling(true)
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/dashboard')
                if (!res.ok) return
                const json = await res.json()
                setData(json)
                // Stop polling if no campaigns are ANALYZING anymore
                const stillAnalyzing = json.campaigns.some((c: CampaignRow) => c.status === 'ANALYZING')
                if (!stillAnalyzing) {
                    setIsPolling(false)
                    clearInterval(interval)
                }
            } catch { /* silent */ }
        }, 30000)

        return () => clearInterval(interval)
    }, [data])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl">
                            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium tracking-wide">Loading Dashboard...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="text-center space-y-4 animate-fade-in-up">
                    <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
                    <p className="text-red-400 font-medium">{error || 'Unknown error'}</p>
                    <button onClick={fetchDashboard} className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const { stats, campaigns } = data

    return (
        <div className="min-h-screen bg-[#0a0a1a]">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#0a0a1a]/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="bg-gradient-to-br from-emerald-400 to-cyan-400 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white tracking-tight">AdBoostAI</h1>
                        </Link>
                        <span className="text-gray-600 text-lg font-light">/</span>
                        <span className="text-gray-400 font-medium text-sm">Dashboard</span>
                        {isPolling && (
                            <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setConnectPlatform(null); setShowConnectModal(true) }}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <Link2 className="h-3.5 w-3.5" />
                            Connect Ad Account
                        </button>
                        <button
                            onClick={fetchDashboard}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-sm font-medium text-white hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            New Analysis
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Connect Ad Account Modal */}
            {showConnectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0f0f2a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold text-lg">Connect Ad Account</h3>
                            <button onClick={() => setShowConnectModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {!connectPlatform ? (
                            <div className="space-y-3">
                                {[
                                    { id: 'meta', label: 'Meta Ads', color: 'from-blue-500 to-indigo-600', icon: '📘' },
                                    { id: 'google', label: 'Google Ads', color: 'from-yellow-500 to-red-500', icon: '🔍' },
                                    { id: 'youtube', label: 'YouTube Ads', color: 'from-red-500 to-pink-500', icon: '🎬' },
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setConnectPlatform(p.id)}
                                        className="w-full flex items-center gap-3 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                                    >
                                        <div className={`bg-gradient-to-br ${p.color} p-2 rounded-lg text-lg`}>{p.icon}</div>
                                        <span className="text-white font-medium">{p.label}</span>
                                        <ArrowRight className="h-4 w-4 text-gray-600 ml-auto group-hover:text-white transition-colors" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-gray-400 text-sm">Enter your <span className="text-white font-medium capitalize">{connectPlatform}</span> Ad Account ID or OAuth URL:</p>
                                <input
                                    type="text"
                                    placeholder={`${connectPlatform === 'meta' ? 'act_123456789' : connectPlatform === 'google' ? '123-456-7890' : 'UC...'}`}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setConnectPlatform(null)} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:bg-white/10 transition-colors">
                                        Back
                                    </button>
                                    <button
                                        onClick={() => { setShowConnectModal(false); setConnectPlatform(null) }}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-sm font-medium text-white hover:from-emerald-400 hover:to-cyan-400 transition-all"
                                    >
                                        Connect
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-600 text-center">OAuth integration coming in Phase 5. This is a placeholder connection.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* System Overview Cards */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">System Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Campaigns */}
                        <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                                        <BarChart3 className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">{stats.totalAnalyses} runs</span>
                                </div>
                                <p className="text-3xl font-bold text-white tracking-tight mb-0.5">{stats.totalCampaigns}</p>
                                <p className="text-xs text-gray-500 font-medium">Total Campaigns</p>
                            </div>
                        </div>

                        {/* Average Fatigue */}
                        <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="bg-amber-500/10 p-2 rounded-lg">
                                        <Activity className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">{stats.campaignsWithRuns} analyzed</span>
                                </div>
                                <p className="text-3xl font-bold text-white tracking-tight mb-0.5">{stats.avgFatigue}<span className="text-lg text-gray-500">/100</span></p>
                                <p className="text-xs text-gray-500 font-medium">Avg Fatigue Score</p>
                            </div>
                        </div>

                        {/* High Risk Campaigns */}
                        <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="bg-red-500/10 p-2 rounded-lg">
                                        <AlertTriangle className="h-4 w-4 text-red-400" />
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">{stats.severityPercent}% of total</span>
                                </div>
                                <p className="text-3xl font-bold text-white tracking-tight mb-0.5">{stats.severeCampaigns}</p>
                                <p className="text-xs text-gray-500 font-medium">High-Risk Campaigns</p>
                            </div>
                        </div>

                        {/* Override Rate */}
                        <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="bg-purple-500/10 p-2 rounded-lg">
                                        <Shield className="h-4 w-4 text-purple-400" />
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">pause decisions</span>
                                </div>
                                <p className="text-3xl font-bold text-white tracking-tight mb-0.5">{stats.overrideRate}<span className="text-lg text-gray-500">%</span></p>
                                <p className="text-xs text-gray-500 font-medium">User Override Rate</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Campaign Table */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Campaign History</h2>
                        <span className="text-xs text-gray-600">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
                    </div>

                    {campaigns.length === 0 ? (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-16 text-center">
                            <div className="bg-white/5 p-4 rounded-2xl w-fit mx-auto mb-4">
                                <Target className="h-8 w-8 text-gray-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-400 mb-2">No campaigns yet</h3>
                            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">Submit your first ad for analysis to start building your campaign intelligence dashboard.</p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-sm font-medium text-white hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <Zap className="h-4 w-4" />
                                Run First Analysis
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/[0.06] text-left">
                                            <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fatigue</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analyzed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.04]">
                                        {campaigns.map((campaign) => {
                                            const severity = campaign.latestRun ? getSeverityColor(campaign.latestRun.severityLevel) : null
                                            const action = campaign.latestRun ? getActionLabel(campaign.latestRun.suggestedAction) : null
                                            const statusBadge = getStatusBadge(campaign.status)

                                            return (
                                                <tr key={campaign.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => window.location.href = `/dashboard/campaign/${campaign.id}`}>
                                                    {/* Campaign Identity */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20 p-2 rounded-lg">
                                                                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-200 text-sm">{campaign.platform}</p>
                                                                <p className="text-xs text-gray-600 font-mono">{campaign.id.slice(0, 12)}…</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadge.color}`}>
                                                            {statusBadge.label}
                                                        </span>
                                                    </td>

                                                    {/* Fatigue Score */}
                                                    <td className="px-5 py-4">
                                                        {campaign.latestRun ? (
                                                            <FatigueGauge score={campaign.latestRun.fatigueScore} />
                                                        ) : (
                                                            <span className="text-gray-600 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Severity Badge */}
                                                    <td className="px-5 py-4">
                                                        {severity ? (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${severity.bg} ${severity.text} ${severity.border}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${severity.dot}`} />
                                                                {campaign.latestRun!.severityLevel}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Suggested Action */}
                                                    <td className="px-5 py-4">
                                                        {action ? (
                                                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${action.color}`}>
                                                                <span>{action.icon}</span>
                                                                {action.label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Confidence */}
                                                    <td className="px-5 py-4">
                                                        {campaign.latestRun ? (
                                                            <span className="text-sm font-mono font-semibold text-gray-300">
                                                                {campaign.latestRun.confidenceScore}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Last Analyzed */}
                                                    <td className="px-5 py-4">
                                                        {campaign.latestRun ? (
                                                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Clock className="h-3 w-3" />
                                                                {timeAgo(campaign.latestRun.createdAt)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600 text-xs">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
