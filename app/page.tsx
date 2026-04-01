'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react'
import { AdInputForm } from '@/components/features/ad-analysis/AdInputForm'
import { AnalysisResults } from '@/components/features/ad-analysis/AnalysisResults'
import { FeedbackForm } from '@/components/features/ad-analysis/FeedbackForm'
import { PerformanceMetricsForm } from '@/components/features/ad-analysis/PerformanceMetricsForm'
import { AdInput, AnalysisResult, CampaignStatus, FeedbackData, PerformanceMetrics } from '@/types'

type Step = 'ad-input' | 'metrics' | 'feedback' | 'results'
type ExtendedCampaignStatus = CampaignStatus | 'AWAITING_USER_ACTION'

const stepOrder: Step[] = ['ad-input', 'metrics', 'feedback', 'results']
const stepLabels: Record<Step, string> = {
  'ad-input': 'Tell us about your ad',
  'metrics': 'Add basic results',
  'feedback': 'Optional customer feedback',
  'results': 'Get simple next steps',
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('ad-input')
  const [adInput, setAdInput] = useState<AdInput | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [workflowStatus, setWorkflowStatus] = useState<ExtendedCampaignStatus>('DRAFT')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [platformStats, setPlatformStats] = useState<{ campaignsMonitored: number; spendProtected: number; creativeRefreshes: number } | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) setPlatformStats(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const stepIndex = stepOrder.indexOf(currentStep) + 1

  useEffect(() => {
    if (!campaignId || workflowStatus !== 'ANALYZING') return

    const eventSource = new EventSource(`/api/campaigns/${campaignId}/stream`)

    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'complete') {
          eventSource.close()
          setWorkflowStatus(data.status as ExtendedCampaignStatus)

          if (data.status === 'FAILED') {
            setErrorMessage('The workflow engine encountered a critical error during analysis.')
            return
          }

          // Fetch final results
          try {
            const res = await fetch(`/api/campaigns/${campaignId}`)
            if (!res.ok) throw new Error('Failed to fetch campaign')
            const campaign = await res.json()
            const run = campaign.latestRun
            if (!run) throw new Error('No analysis run found')

            const recommendations = JSON.parse(run.recommendationOutput)
            const fatigueOutput = JSON.parse(run.fatigueOutput)

            setAnalysisResult({
              adId: campaign.id,
              timestamp: new Date(run.createdAt),
              summary: 'Workflow Engine completed analysis',
              fatigueDiagnosis: {
                level: 'moderate',
                severityLevel: run.severityLevel,
                impactScore: run.fatigueScore || 0,
                confidence: run.confidenceScore || 0,
                primaryReasons: [fatigueOutput.primaryIssue || 'Unknown'],
              },
              recommendations: [],
              structuredRecommendations: recommendations,
            })
            setCurrentStep('results')
          } catch (fetchErr) {
            console.error('Failed to fetch final results:', fetchErr)
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => eventSource.close()
  }, [campaignId, workflowStatus])

  const handleAdInputSubmit = (data: AdInput) => {
    setAdInput(data)
    setMetrics({
      impressions: 42500,
      clicks: 850,
      ctr: 2.0,
      spend: 1250,
      conversions: 24,
      cpc: 1.47,
      cpm: 29.41,
      cpa: 52.08,
      roas: 0.96,
      frequency: 2.1,
      durationDays: 14,
    })
    setCurrentStep('metrics')
  }

  const handleMetricsSubmit = (metricsData: PerformanceMetrics) => {
    setMetrics(metricsData)
    setCurrentStep('feedback')
  }

  const handleFeedbackSubmit = async (feedback: FeedbackData | undefined) => {
    if (!adInput || !metrics) return

    setWorkflowStatus('ANALYZING')
    setErrorMessage(null)

    try {
      const resCampaign = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: adInput.platform,
          adType: 'Standard Ad',
          metrics,
          feedback,
        }),
      })
      const campaign = await resCampaign.json()
      setCampaignId(campaign.id)

      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id }),
      })
    } catch (error) {
      console.error('Failed to initiate workflow:', error)
      setWorkflowStatus('FAILED')
      setErrorMessage('Failed to connect to the workflow engine.')
    }
  }

  const handleDecision = async (decision: string) => {
    if (!campaignId) return

    try {
      await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          actionTaken: decision,
          notes: 'User interacted via workflow UI',
        }),
      })
      setWorkflowStatus('COMPLETED')
    } catch (e) {
      console.error('Failed to track decision', e)
    }
  }

  const handleReset = () => {
    setCurrentStep('ad-input')
    setAdInput(null)
    setMetrics(null)
    setAnalysisResult(null)
    setCampaignId(null)
    setWorkflowStatus('DRAFT')
    setErrorMessage(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* ─── Hero ─────────────────────────────── */}
      <section className="rise-in grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="top-gradient rounded-2xl p-8 sm:p-10">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/90">
            <Sparkles className="h-3.5 w-3.5" /> Campaign Checkup
          </p>
          <h1 className="max-w-xl text-3xl font-bold leading-[1.15] text-white sm:text-4xl">
            Stop losing budget to fatigued creatives.
          </h1>
          <div className="mt-5 max-w-xl space-y-3 text-sm leading-relaxed text-white/80 sm:text-base">
            <p><span className="font-semibold text-white">The problem:</span> Marketers running paid ads lose 25–40% of their budget to fatigued creatives. CTR drops on day 3. They notice on day 8. The money is already gone.</p>
            <p><span className="font-semibold text-white">What AdBoostAI does:</span> It watches every campaign signal in real-time, runs a structured AI debate between four specialist agents, and either alerts the human or acts autonomously &mdash; before the budget is wasted.</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition-transform hover:scale-[1.02]">
              Open Dashboard
            </Link>
            <a href="#analysis-workflow" className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20">
              Start Analysis <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="surface-card flex flex-col justify-center p-6 gap-6">
          {/* ─── Impact Counter ──────────── */}
          {platformStats && (
            <div className="flex items-center gap-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{platformStats.campaignsMonitored}</p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Monitored</p>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">${platformStats.spendProtected.toLocaleString()}</p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Protected</p>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{platformStats.creativeRefreshes}</p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Refreshes</p>
              </div>
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Progress</p>
          <h2 className="mt-2 text-lg font-bold text-white">What happens next</h2>
          <div className="mt-5 space-y-3">
            {stepOrder.map((step, i) => {
              const completed = i < stepIndex - 1 || (currentStep === 'results' && i === stepOrder.length - 1)
              const active = step === currentStep
              return (
                <div key={step} className="flex items-center gap-3">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    completed
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : active
                        ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/30'
                        : 'bg-white/[0.06] text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className={`text-sm ${active ? 'font-medium text-white' : 'text-slate-400'}`}>
                    {stepLabels[step]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Analysis Workflow ────────────────── */}
      <section id="analysis-workflow" className="rise-in surface-card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Step {stepIndex} of 4</p>
            <h2 className="mt-1 text-xl font-bold text-white">Campaign Checkup</h2>
          </div>
          {workflowStatus === 'ANALYZING' && (
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running
            </span>
          )}
        </div>

        <div className="relative">
          {workflowStatus === 'ANALYZING' && (
            <div className="absolute inset-0 z-20 flex min-h-[420px] items-center justify-center rounded-2xl bg-[#0B1120]/90 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-400" />
                <p className="mt-3 text-sm font-semibold text-white">Analyzing your campaign</p>
                <p className="mt-1 text-xs text-slate-400">Four AI agents are debating the signals…</p>
              </div>
            </div>
          )}

          {workflowStatus === 'FAILED' && (
            <div className="absolute inset-0 z-20 flex min-h-[420px] items-center justify-center rounded-2xl bg-red-950/90 backdrop-blur-sm">
              <div className="max-w-md px-6 text-center">
                <XCircle className="mx-auto h-9 w-9 text-red-400" />
                <p className="mt-3 text-sm font-semibold text-white">Workflow failed</p>
                <p className="mt-1 text-xs text-red-300">{errorMessage}</p>
                <button onClick={handleReset} className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20">
                  Reset
                </button>
              </div>
            </div>
          )}

          {currentStep === 'ad-input' && <AdInputForm onSubmit={handleAdInputSubmit} />}
          {currentStep === 'metrics' && <PerformanceMetricsForm onSubmit={handleMetricsSubmit} onBack={() => setCurrentStep('ad-input')} />}
          {currentStep === 'feedback' && workflowStatus !== 'ANALYZING' && workflowStatus !== 'FAILED' && (
            <FeedbackForm onSubmit={handleFeedbackSubmit} onBack={() => setCurrentStep('metrics')} onSkip={() => handleFeedbackSubmit(undefined)} />
          )}

          {currentStep === 'results' && analysisResult && (
            <div className="space-y-6">
              <AnalysisResults result={analysisResult} onReset={handleReset} />

              {workflowStatus !== 'COMPLETED' ? (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <p className="text-sm font-semibold text-white">Record your decision</p>
                  <p className="mt-1 text-xs text-slate-400">This feedback trains the collaboration and recommendation agents.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => handleDecision('pause_ad')} className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white">
                      Pause Campaign
                    </button>
                    <button onClick={() => handleDecision('refresh_creative')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500">
                      Refresh Creative <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Decision recorded successfully
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
