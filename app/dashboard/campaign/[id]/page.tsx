'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Sparkles,
    Loader2,
    AlertTriangle,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Brain,
    Layers,
    Shield,
    ChevronRight,
    Target,
    BarChart3,
    Eye,
    CheckCircle,
    DollarSign,
    Activity,
    Users,
    ThumbsUp,
    ThumbsDown,
    Edit3,
    Lightbulb,
    CheckCircle2,
    Check
} from 'lucide-react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend)

// ─── Types ──────────────────────────────────────────

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: Record<string, any>
}

interface LearningBias {
    totalDecisions: number
    pauseCount: number
    refreshCount: number
    avgFatigueAtPause: number
    avgFatigueAtContinue: number
    overrideRate: number
    systemPauseCount: number
    userIgnoredPause: number
}

interface DecisionConsistency {
    score: number
    totalDecisions: number
    alignedCount: number
    overrideCount: number
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

interface IntelligenceData {
    campaign: {
        id: string
        platform: string
        adType: string | null
        status: string
        createdAt: string
        updatedAt: string
    }
    fatigueTrend: FatigueTrendPoint[]
    hasFatigueAcceleration: boolean
    agentTimeline: AgentTimelineEntry[]
    learningBias: LearningBias
    decisionConsistency: DecisionConsistency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    latestRun: any
    latestForecast: ForecastData | null
    similarCampaigns: SimilarCampaignData[]
    creativeSuggestions: {
        id: string
        primaryCause: string
        suggestionType: 'HEADLINE' | 'CTA' | 'REFRAME' | 'STRUCTURAL'
        content: string
        explanation: string
        confidenceImpact: number
        applied: boolean
        createdAt: string
    }[]
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

// ─── Agent Progress Types ───────────────────────────

const AGENT_STEPS = [
    'ANALYSIS_AGENT',
    'FATIGUE_AGENT',
    'LEARNING_AGENT',
    'SIGNAL_NORMALIZE',
    'FORECAST_ENGINE',
    'MEMORY_ENGINE',
    'COLLABORATION_PROFILE',
    'ANALYST',
    'CRITIC',
    'MEMORY',
    'SYNTHESIZER',
    'CREATIVE_ENGINE',
] as const

// ─── Helpers ────────────────────────────────────────

function formatTime(ts: string): string {
    return new Date(ts).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
}

const AGENT_META: Record<string, { label: string; color: string; icon: string; bgColor: string }> = {
    ANALYSIS_AGENT: { label: 'Analysis Agent', color: 'text-cyan-400', icon: '🔍', bgColor: 'bg-cyan-500/10' },
    FATIGUE_AGENT: { label: 'Fatigue Agent', color: 'text-amber-400', icon: '😴', bgColor: 'bg-amber-500/10' },
    LEARNING_AGENT: { label: 'Learning Agent', color: 'text-purple-400', icon: '📚', bgColor: 'bg-purple-500/10' },
    SIGNAL_NORMALIZE: { label: 'Signal Normalize', color: 'text-teal-400', icon: '📊', bgColor: 'bg-teal-500/10' },
    FORECAST_ENGINE: { label: 'Forecast Engine', color: 'text-indigo-400', icon: '💰', bgColor: 'bg-indigo-500/10' },
    MEMORY_ENGINE: { label: 'Memory Search', color: 'text-orange-400', icon: '🔎', bgColor: 'bg-orange-500/10' },
    COLLABORATION_PROFILE: { label: 'Collaboration', color: 'text-pink-400', icon: '🤝', bgColor: 'bg-pink-500/10' },
    ANALYST: { label: 'Analyst (R1)', color: 'text-sky-400', icon: '🧠', bgColor: 'bg-sky-500/10' },
    CRITIC: { label: 'Critic (R2)', color: 'text-rose-400', icon: '⚔️', bgColor: 'bg-rose-500/10' },
    MEMORY: { label: 'Memory (R2.5)', color: 'text-violet-400', icon: '🗂️', bgColor: 'bg-violet-500/10' },
    SYNTHESIZER: { label: 'Synthesizer (R3)', color: 'text-emerald-400', icon: '✨', bgColor: 'bg-emerald-500/10' },
    CREATIVE_ENGINE: { label: 'Creative Engine', color: 'text-fuchsia-400', icon: '💡', bgColor: 'bg-fuchsia-500/10' },
    WORKFLOW_ERROR: { label: 'Workflow Error', color: 'text-red-400', icon: '❌', bgColor: 'bg-red-500/10' },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function summarizePayload(step: string, payload: Record<string, any>): string {
    switch (step) {
        case 'ANALYSIS_AGENT':
            return Object.entries(payload)
                .map(([k, v]) => `${k}=${String(v)}`)
                .join(', ')
        case 'FATIGUE_AGENT':
            return `score=${payload.fatigueScore}, issue="${payload.primaryIssue}"`
        case 'LEARNING_AGENT':
            return `bias ${payload.suggestedConfidenceAdjustment >= 0 ? '+' : ''}${payload.suggestedConfidenceAdjustment}%, overrideRate=${Math.round((payload.historicalOverrideRate || 0) * 100)}%`
        case 'DECISION_AGENT':
            return `${payload.suggestedAction} (severity=${payload.severityLevel}, confidence=${payload.confidenceScore}%)`
        case 'RECOMMENDATION_AGENT':
            if (Array.isArray(payload)) {
                return payload.map(r => r.text?.slice(0, 50) + '...').join(' | ')
            }
            return JSON.stringify(payload).slice(0, 80)
        case 'FORECAST_ENGINE':
            if (payload.status === 'unavailable') return 'Forecast service unavailable'
            return `burnRate=$${payload.projectedBurnRate ?? '?'}/day, budgetRisk=${payload.budgetRiskLevel ?? '?'}`
        case 'ANALYST':
            if (Array.isArray(payload)) {
                return payload.map(h => `${h.cause}(${(h.confidence * 100).toFixed(0)}%)`).join(', ')
            }
            return JSON.stringify(payload).slice(0, 80)
        case 'CRITIC':
            if (Array.isArray(payload)) {
                return payload.map(c => `${c.hypothesis}→${(c.revisedConfidence * 100).toFixed(0)}%`).join(', ')
            }
            return JSON.stringify(payload).slice(0, 80)
        case 'SYNTHESIZER':
            return `${payload.recommendedAction} (cause=${payload.primaryCause}, conf=${(payload.confidence * 100).toFixed(0)}%, sev=${payload.severity})`
        case 'MEMORY':
            return `${payload.similarPatternCount} patterns, adj=${payload.confidenceAdjustment >= 0 ? '+' : ''}${(payload.confidenceAdjustment * 100).toFixed(0)}%`
        case 'SIGNAL_NORMALIZE':
            return 'Signal fingerprints normalized (Min-Max [-1,1])'
        case 'MEMORY_ENGINE':
            if (payload.similarCampaigns?.length > 0) {
                return payload.similarCampaigns.map((s: SimilarCampaignData) => `${s.campaignId.slice(0, 8)}(${(1 - s.similarityScore).toFixed(0)}%)`).join(', ')
            }
            return 'No similar campaigns found (cold start or insufficient data)'
        case 'COLLABORATION_PROFILE':
            if (payload.status === 'none') return 'No collaboration profile yet'
            return `risk=${(payload.riskToleranceScore * 100).toFixed(0)}%, verbosity=${payload.verbosityPreference}`
        case 'CREATIVE_ENGINE':
            return `Generated ${payload.suggestionsGenerated || 0} actionable suggestions for: ${payload.cause}`
        default:
            return JSON.stringify(payload).slice(0, 100)
    }
}

// ─── Consistency Ring ──────────────────────────────

function ConsistencyRing({ score }: { score: number }) {
    const radius = 56
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'

    return (
        <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                    cx="64" cy="64" r={radius} fill="none"
                    stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{score}%</span>
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Alignment</span>
            </div>
        </div>
    )
}

// ─── Agent Progress Component ───────────────────────

function AgentProgressTracker({ campaignId }: { campaignId: string }) {
    const [completedSteps, setCompletedSteps] = useState<string[]>([])
    const [status, setStatus] = useState<string>('ANALYZING')

    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await fetch(`/api/campaigns/${campaignId}`)
                if (!res.ok) return
                const data = await res.json()
                setCompletedSteps(data.completedSteps || [])
                setStatus(data.status)

                if (data.status !== 'ANALYZING') {
                    clearInterval(poll)
                    // Redirect to full intelligence page after a brief delay
                    if (data.status === 'DECISION_READY' || data.status === 'COMPLETED') {
                        setTimeout(() => window.location.reload(), 1500)
                    }
                }
            } catch { /* ignore */ }
        }, 1000)

        return () => clearInterval(poll)
    }, [campaignId])

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-lg animate-fade-in-up">
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl">
                                <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">Workflow Engine Running</h2>
                        <p className="text-sm text-gray-500">Multi-agent pipeline executing sequentially</p>
                    </div>

                    {/* Agent Steps */}
                    <div className="space-y-2">
                        {AGENT_STEPS.map((step, index) => {
                            const meta = AGENT_META[step]
                            const isCompleted = completedSteps.includes(step)
                            // Current running = first non-completed step
                            const firstIncomplete = AGENT_STEPS.findIndex(s => !completedSteps.includes(s))
                            const isRunning = index === firstIncomplete && status === 'ANALYZING'
                            const isPending = index > firstIncomplete

                            return (
                                <div
                                    key={step}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${isCompleted ? 'bg-emerald-500/5 border border-emerald-500/10' :
                                        isRunning ? 'bg-white/[0.04] border border-white/10' :
                                            'bg-transparent border border-transparent opacity-40'
                                        }`}
                                >
                                    {/* Status Icon */}
                                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                        {isCompleted ? (
                                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                                        ) : isRunning ? (
                                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                                        ) : (
                                            <div className="h-5 w-5 border-2 border-gray-700 rounded-full" />
                                        )}
                                    </div>

                                    {/* Agent Icon */}
                                    <span className="text-lg">{meta.icon}</span>

                                    {/* Agent Name */}
                                    <span className={`text-sm font-medium flex-1 ${isCompleted ? 'text-emerald-400' :
                                        isRunning ? 'text-white' :
                                            'text-gray-600'
                                        }`}>
                                        {meta.label}
                                    </span>

                                    {/* Status Label */}
                                    {isCompleted && (
                                        <span className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-wider">Complete</span>
                                    )}
                                    {isRunning && (
                                        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider animate-pulse">Running</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Status message */}
                    {status !== 'ANALYZING' && (
                        <div className="mt-6 text-center">
                            <p className="text-emerald-400 font-semibold text-sm">✅ Pipeline complete. Loading results...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Chart.js Fatigue Trend Chart ──────────────────

function FatigueTrendChart({ data, hasFatigueAcceleration }: { data: FatigueTrendPoint[], hasFatigueAcceleration: boolean }) {
    const chartRef = useRef(null)

    if (data.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-8 w-8 text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm">Need at least 2 analysis runs to show trend.</p>
                <p className="text-gray-600 text-xs mt-1">Re-analyze this campaign to build history.</p>
            </div>
        )
    }

    const labels = data.map(d => `#${d.runIndex}`)

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Fatigue Score',
                data: data.map(d => d.fatigueScore),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#0a0a1a',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                borderWidth: 2.5,
            },
            {
                label: 'Confidence Score',
                data: data.map(d => d.confidenceScore),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#0a0a1a',
                pointBorderWidth: 2,
                borderWidth: 2,
                borderDash: [4, 2],
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#12122a',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                titleColor: '#9ca3af',
                titleFont: { size: 11, family: 'monospace' },
                bodyColor: '#fff',
                bodyFont: { size: 13 },
                cornerRadius: 12,
                callbacks: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    title: (ctx: any) => {
                        const point = data[ctx[0].dataIndex]
                        return `Run #${point.runIndex} · ${new Date(point.timestamp).toLocaleDateString()}`
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    afterBody: (ctx: any) => {
                        const point = data[ctx[0].dataIndex]
                        return `${point.severityLevel} → ${point.suggestedAction}`
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } },
                border: { display: false },
            },
            y: {
                min: 0,
                max: 100,
                grid: { color: 'rgba(255,255,255,0.03)' },
                ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } },
                border: { display: false },
            },
        },
    }

    return (
        <>
            {/* Acceleration Warning */}
            {hasFatigueAcceleration && (
                <div className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 animate-fade-in-up">
                    <div className="bg-red-500/20 p-2 rounded-lg flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                        <p className="text-red-400 font-semibold text-sm">Creative Exhaustion Detected</p>
                        <p className="text-red-400/70 text-xs">Trend indicates creative exhaustion acceleration. Fatigue scores are rising consistently across runs.</p>
                    </div>
                </div>
            )}

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div style={{ height: '280px' }}>
                    <Line ref={chartRef} data={chartData} options={options} />
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-amber-400 rounded-full" />
                        <span className="text-xs text-gray-500">Fatigue Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-indigo-400 rounded-full" />
                        <span className="text-xs text-gray-500">Confidence Score</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="w-6 h-px bg-red-500/30 border-dashed border-t border-red-500" />
                        <span className="text-xs text-gray-600">Threshold Lines at 60 (HIGH) / 80 (CRITICAL)</span>
                    </div>
                </div>
            </div>
        </>
    )
}

// ─── Main Page ──────────────────────────────────────

export default function CampaignIntelligencePage() {
    const params = useParams()
    const campaignId = params.id as string

    const [data, setData] = useState<IntelligenceData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [campaignStatus, setCampaignStatus] = useState<string | null>(null)

    useEffect(() => {
        async function fetchIntelligence() {
            try {
                // First check campaign status
                const statusRes = await fetch(`/api/campaigns/${campaignId}`)
                if (!statusRes.ok) throw new Error('Failed to fetch')
                const statusData = await statusRes.json()
                setCampaignStatus(statusData.status)

                // If still analyzing, don't fetch intelligence
                if (statusData.status === 'ANALYZING') {
                    setLoading(false)
                    return
                }

                // Fetch full intelligence data
                const res = await fetch(`/api/campaigns/${campaignId}/intelligence`)
                if (!res.ok) throw new Error('Failed to fetch intelligence')
                const json = await res.json()
                setData(json)
            } catch (err) {
                setError('Failed to load campaign intelligence')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        if (campaignId) fetchIntelligence()
    }, [campaignId])

    // ─── Decision Handler ──────────────────────────────
    async function submitDecision(campId: string, decision: string) {
        try {
            const res = await fetch(`/api/campaigns/${campId}/decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userResponse: decision }),
            })
            if (res.ok) {
                // Reload to refresh the collaboration profile
                window.location.reload()
            } else {
                console.error('Decision submission failed')
            }
        } catch (err) {
            console.error('Decision submission error:', err)
        }
    }

    // ─── Mark Suggestion Applied Handler ───────────────────────
    async function markSuggestionApplied(campId: string, suggestionId: string) {
        try {
            const res = await fetch(`/api/campaigns/${campId}/suggestions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suggestionId }),
            })
            if (res.ok) {
                // Update local state instead of full reload for better UX
                setData(prev => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        creativeSuggestions: prev.creativeSuggestions.map(s =>
                            s.id === suggestionId ? { ...s, applied: true } : s
                        )
                    }
                })
            } else {
                console.error('Failed to mark suggestion applied')
            }
        } catch (err) {
            console.error('Error marking suggestion applied:', err)
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl">
                            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Loading Intelligence...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error && !data && campaignStatus !== 'ANALYZING') {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
                    <p className="text-red-400 font-medium">{error}</p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a1a]">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#0a0a1a]/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="bg-gradient-to-br from-emerald-400 to-cyan-400 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white tracking-tight">AdBoostAI</h1>
                        </Link>
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                        <Link href="/dashboard" className="text-gray-400 hover:text-gray-300 text-sm font-medium transition-colors">Dashboard</Link>
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                        <span className="text-white text-sm font-semibold">Intelligence</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-gray-400 font-mono text-xs">
                            {data?.campaign.platform || '...'} · {campaignId.slice(0, 10)}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ═══════════════════════════════════════════════════
                    AGENT PROGRESS UI (when ANALYZING)
                ═══════════════════════════════════════════════════ */}
                {campaignStatus === 'ANALYZING' && (
                    <AgentProgressTracker campaignId={campaignId} />
                )}

                {/* ═══════════════════════════════════════════════════
                    FULL INTELLIGENCE VIEW (when data loaded)
                ═══════════════════════════════════════════════════ */}
                {data && (
                    <>
                        {/* 1️⃣ FATIGUE TREND CHART */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-amber-500/10 p-2 rounded-lg">
                                    <TrendingUp className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg">Fatigue Trend</h2>
                                    <p className="text-xs text-gray-500">{data.fatigueTrend.length} analysis run{data.fatigueTrend.length !== 1 ? 's' : ''} tracked</p>
                                </div>
                            </div>
                            <FatigueTrendChart data={data.fatigueTrend} hasFatigueAcceleration={data.hasFatigueAcceleration} />
                        </section>

                        {/* 2️⃣ AGENT EXECUTION TIMELINE */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-cyan-500/10 p-2 rounded-lg">
                                    <Layers className="h-4 w-4 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg">Agent Execution Timeline</h2>
                                    <p className="text-xs text-gray-500">Latest pipeline trace</p>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                                {data.agentTimeline.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Layers className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No workflow logs yet.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/[0.04]">
                                        {data.agentTimeline.map((entry, i) => {
                                            const meta = AGENT_META[entry.step] || { label: entry.step, color: 'text-gray-400', icon: '⚙️', bgColor: 'bg-gray-500/10' }
                                            return (
                                                <div key={i} className="group flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                                    <div className="flex flex-col items-center pt-0.5">
                                                        <div className="text-lg leading-none">{meta.icon}</div>
                                                        {i < data.agentTimeline.length - 1 && (
                                                            <div className="w-px h-full min-h-[20px] bg-white/[0.06] mt-1" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                                                            <span className="text-[10px] text-gray-600 font-mono bg-white/[0.03] px-1.5 py-0.5 rounded">
                                                                {formatTime(entry.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-mono leading-relaxed break-all">
                                                            {summarizePayload(entry.step, entry.payload)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Bottom Grid: Learning Bias + Decision Consistency */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* 3️⃣ LEARNING BIAS PANEL */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-purple-500/10 p-2 rounded-lg">
                                        <Brain className="h-4 w-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg">Learning Bias</h2>
                                        <p className="text-xs text-gray-500">Behavioral patterns from user decisions</p>
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                                    {data.learningBias.totalDecisions === 0 ? (
                                        <div className="text-center py-8">
                                            <Eye className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">No decisions recorded yet.</p>
                                            <p className="text-gray-600 text-xs mt-1">Complete an analysis and make a decision to train the learning layer.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {data.learningBias.avgFatigueAtPause > 0 && (
                                                    <div className="flex items-start gap-3 bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                                                        <div className="bg-red-500/10 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                                                            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                                                        </div>
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            User historically pauses at avg fatigue <span className="text-white font-bold font-mono">{data.learningBias.avgFatigueAtPause}</span>.
                                                        </p>
                                                    </div>
                                                )}
                                                {data.learningBias.avgFatigueAtContinue > 0 && (
                                                    <div className="flex items-start gap-3 bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                                                        <div className="bg-emerald-500/10 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                                                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                                                        </div>
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            User continues/refreshes at avg fatigue <span className="text-white font-bold font-mono">{data.learningBias.avgFatigueAtContinue}</span>.
                                                        </p>
                                                    </div>
                                                )}
                                                {data.learningBias.systemPauseCount > 0 && (
                                                    <div className="flex items-start gap-3 bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                                                        <div className="bg-amber-500/10 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                                                            <Shield className="h-3.5 w-3.5 text-amber-400" />
                                                        </div>
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            System recommended pause <span className="text-white font-bold font-mono">{data.learningBias.systemPauseCount}</span> time{data.learningBias.systemPauseCount !== 1 ? 's' : ''}. User ignored <span className="text-white font-bold font-mono">{data.learningBias.userIgnoredPause}</span> time{data.learningBias.userIgnoredPause !== 1 ? 's' : ''}.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 pt-2">
                                                <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                                                    <p className="text-xl font-bold text-white">{data.learningBias.totalDecisions}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Decisions</p>
                                                </div>
                                                <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                                                    <p className="text-xl font-bold text-red-400">{data.learningBias.pauseCount}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Pauses</p>
                                                </div>
                                                <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                                                    <p className="text-xl font-bold text-blue-400">{data.learningBias.refreshCount}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Refreshes</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 4️⃣ DECISION CONSISTENCY SCORE */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                                        <Target className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg">Decision Consistency</h2>
                                        <p className="text-xs text-gray-500">User vs system alignment</p>
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                                    {data.decisionConsistency.totalDecisions === 0 ? (
                                        <div className="text-center py-8">
                                            <Target className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">No decisions to compare yet.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6">
                                            <ConsistencyRing score={data.decisionConsistency.score} />
                                            <div className="text-center">
                                                <p className="text-sm text-gray-300 font-medium">
                                                    Decision Alignment: <span className="text-white font-bold">{data.decisionConsistency.score}%</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                                                    {data.decisionConsistency.score >= 80
                                                        ? 'User closely follows system recommendations. High trust signal.'
                                                        : data.decisionConsistency.score >= 50
                                                            ? 'Moderate alignment. User exercises independent judgement.'
                                                            : 'Low alignment. User frequently overrides system. Learning agent should adapt.'
                                                    }
                                                </p>
                                            </div>
                                            <div className="w-full grid grid-cols-2 gap-3">
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-center">
                                                    <p className="text-2xl font-bold text-emerald-400">{data.decisionConsistency.alignedCount}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">Aligned</p>
                                                </div>
                                                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-center">
                                                    <p className="text-2xl font-bold text-red-400">{data.decisionConsistency.overrideCount}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">Overridden</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* 5️⃣ FINANCIAL INTELLIGENCE */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-indigo-500/10 p-2 rounded-lg">
                                    <DollarSign className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg">Financial Intelligence</h2>
                                    <p className="text-xs text-gray-500">Budget forecasting &amp; risk assessment</p>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                                {!data.latestForecast ? (
                                    <div className="text-center py-8">
                                        <DollarSign className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No forecast data available.</p>
                                        <p className="text-gray-600 text-xs mt-1">Ensure the Python forecast service is running and campaign has performance snapshots.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {/* Risk Badges Row */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className={`rounded-xl p-4 text-center border ${data.latestForecast.budgetRiskLevel === 'HIGH'
                                                ? 'bg-red-500/5 border-red-500/10'
                                                : data.latestForecast.budgetRiskLevel === 'MEDIUM'
                                                    ? 'bg-amber-500/5 border-amber-500/10'
                                                    : 'bg-emerald-500/5 border-emerald-500/10'
                                                }`}>
                                                <p className={`text-xl font-bold ${data.latestForecast.budgetRiskLevel === 'HIGH' ? 'text-red-400'
                                                    : data.latestForecast.budgetRiskLevel === 'MEDIUM' ? 'text-amber-400'
                                                        : 'text-emerald-400'
                                                    }`}>{data.latestForecast.budgetRiskLevel}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">Budget Risk</p>
                                            </div>
                                            <div className={`rounded-xl p-4 text-center border ${data.latestForecast.statisticalConfidenceRisk === 'HIGH'
                                                ? 'bg-red-500/5 border-red-500/10'
                                                : data.latestForecast.statisticalConfidenceRisk === 'MEDIUM'
                                                    ? 'bg-amber-500/5 border-amber-500/10'
                                                    : 'bg-emerald-500/5 border-emerald-500/10'
                                                }`}>
                                                <p className={`text-xl font-bold ${data.latestForecast.statisticalConfidenceRisk === 'HIGH' ? 'text-red-400'
                                                    : data.latestForecast.statisticalConfidenceRisk === 'MEDIUM' ? 'text-amber-400'
                                                        : 'text-emerald-400'
                                                    }`}>{data.latestForecast.statisticalConfidenceRisk}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">Statistical Risk</p>
                                            </div>
                                            <div className={`rounded-xl p-4 text-center border ${data.latestForecast.modelConfidence === 'LOW'
                                                ? 'bg-red-500/5 border-red-500/10'
                                                : data.latestForecast.modelConfidence === 'MEDIUM'
                                                    ? 'bg-amber-500/5 border-amber-500/10'
                                                    : 'bg-emerald-500/5 border-emerald-500/10'
                                                }`}>
                                                <p className={`text-xl font-bold ${data.latestForecast.modelConfidence === 'LOW' ? 'text-red-400'
                                                    : data.latestForecast.modelConfidence === 'MEDIUM' ? 'text-amber-400'
                                                        : 'text-emerald-400'
                                                    }`}>{data.latestForecast.modelConfidence}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">Model Confidence</p>
                                            </div>
                                        </div>

                                        {/* Detail Cards */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/[0.03] rounded-xl p-4">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Projected Burn Rate</p>
                                                <p className="text-2xl font-bold text-white font-mono">
                                                    {data.latestForecast.projectedBurnRate != null
                                                        ? `$${data.latestForecast.projectedBurnRate.toFixed(2)}`
                                                        : '—'
                                                    }
                                                    <span className="text-sm text-gray-500 font-normal ml-1">/day</span>
                                                </p>
                                            </div>
                                            <div className="bg-white/[0.03] rounded-xl p-4">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">Budget Exhaustion</p>
                                                <p className="text-2xl font-bold text-white font-mono">
                                                    {data.latestForecast.predictedSpendExhaustionDate
                                                        ? new Date(data.latestForecast.predictedSpendExhaustionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                        : '—'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 6️⃣ SIMILAR PAST CAMPAIGNS (Phase 4) */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-orange-500/10 p-2 rounded-lg">
                                    <Activity className="h-4 w-4 text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg">Similar Past Campaigns</h2>
                                    <p className="text-xs text-gray-500">Memory-based similarity matching</p>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                                {!data.similarCampaigns || data.similarCampaigns.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Activity className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No similar campaigns found.</p>
                                        <p className="text-gray-600 text-xs mt-1">The system needs at least 10 analyzed campaigns to build a memory profile.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.similarCampaigns.map((sc, i) => {
                                            const similarity = Math.round((1 - sc.similarityScore) * 100)
                                            const outcomeColor = sc.outcomeStatus === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                : sc.outcomeStatus === 'FAILED' ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                                    : 'text-gray-400 bg-gray-500/10 border-gray-500/20'
                                            return (
                                                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1">
                                                            <span className="text-orange-400 text-xs font-mono font-bold">{similarity}%</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-white text-sm font-medium font-mono">{sc.campaignId.slice(0, 12)}...</p>
                                                            <p className="text-gray-500 text-xs">Decision: <span className="text-gray-300">{sc.finalDecision}</span></p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wider ${outcomeColor}`}>
                                                        {sc.outcomeStatus}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 7️⃣ AI COLLABORATION PROFILE (Phase 5) */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-pink-500/10 p-2 rounded-lg">
                                    <Users className="h-4 w-4 text-pink-400" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg">AI Collaboration Profile</h2>
                                    <p className="text-xs text-gray-500">Behavioral adaptation & decision tracking</p>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                                {/* Decision Buttons */}
                                {data.latestRecommendation && data.latestRecommendation.status === 'PENDING' && !data.latestRecommendation.userResponse && (
                                    <div className="bg-gradient-to-r from-pink-500/5 to-violet-500/5 border border-pink-500/15 rounded-xl p-5">
                                        <p className="text-white text-sm font-semibold mb-1">Pending Recommendation</p>
                                        <p className="text-gray-400 text-xs mb-4">
                                            Action: <span className="text-white font-medium">{data.latestRecommendation.interventionType}</span>
                                            {' — '}{data.latestRecommendation.recommendedContent}
                                        </p>
                                        <div className="flex gap-3">
                                            <button onClick={() => submitDecision(data.campaign.id, 'ACCEPTED')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                                                <ThumbsUp className="h-3.5 w-3.5" /> Accept
                                            </button>
                                            <button onClick={() => submitDecision(data.campaign.id, 'REJECTED')} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                                                <ThumbsDown className="h-3.5 w-3.5" /> Reject
                                            </button>
                                            <button onClick={() => submitDecision(data.campaign.id, 'MODIFIED')} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-colors">
                                                <Edit3 className="h-3.5 w-3.5" /> Modify
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Profile Stats */}
                                {!data.collaborationProfile ? (
                                    <div className="text-center py-6">
                                        <Users className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No collaboration data yet.</p>
                                        <p className="text-gray-600 text-xs mt-1">Accept or reject recommendations to build your profile.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-emerald-400">{Math.round(data.collaborationProfile.acceptRate * 100)}%</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">Accept</p>
                                            </div>
                                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-red-400">{Math.round(data.collaborationProfile.rejectRate * 100)}%</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">Reject</p>
                                            </div>
                                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-amber-400">{Math.round(data.collaborationProfile.overrideRate * 100)}%</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">Override</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/[0.03] rounded-xl p-4">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Risk Tolerance</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" style={{ width: `${data.collaborationProfile.riskToleranceScore * 100}%` }} />
                                                    </div>
                                                    <span className="text-white text-sm font-mono font-bold">
                                                        {data.collaborationProfile.riskToleranceScore < 0.3 ? 'Low' : data.collaborationProfile.riskToleranceScore > 0.7 ? 'High' : 'Moderate'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-white/[0.03] rounded-xl p-4">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Communication Style</p>
                                                <span className={`text-sm px-3 py-1 rounded-full border font-semibold ${data.collaborationProfile.verbosityPreference === 'CONCISE' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' : 'text-sky-400 bg-sky-500/10 border-sky-500/20'}`}>
                                                    {data.collaborationProfile.verbosityPreference}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* 8️⃣ CREATIVE INTERVENTIONS (Phase 6) */}
                        {data.creativeSuggestions && data.creativeSuggestions.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-fuchsia-500/10 p-2 rounded-lg">
                                        <Lightbulb className="h-4 w-4 text-fuchsia-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg">Creative Interventions</h2>
                                        <p className="text-xs text-gray-500">Actionable improvements for detected issues</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {data.creativeSuggestions.map((suggestion) => (
                                        <div key={suggestion.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            {suggestion.suggestionType}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">Primary Cause: {suggestion.primaryCause}</span>
                                                    </div>
                                                    <p className="text-white font-medium text-sm leading-relaxed mb-3">"{suggestion.content}"</p>

                                                    <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.02]">
                                                        <p className="text-xs text-gray-400 italic">
                                                            <span className="font-semibold text-gray-300 not-italic mr-1">Why:</span>
                                                            {suggestion.explanation}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-3 min-w-[120px]">
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Confidence Impact</p>
                                                        <p className="text-emerald-400 font-mono text-sm font-bold">+{Math.round(suggestion.confidenceImpact * 100)}%</p>
                                                    </div>
                                                    {suggestion.applied ? (
                                                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => markSuggestionApplied(data.campaign.id, suggestion.id)}
                                                            className="flex items-center gap-1.5 text-white text-xs font-medium px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 rounded-lg transition-all shadow-lg shadow-fuchsia-900/20"
                                                        >
                                                            <Check className="h-3 w-3" /> Mark Applied
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
