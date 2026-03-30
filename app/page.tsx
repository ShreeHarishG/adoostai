'use client'

import { useEffect, useState } from 'react'
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

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('ad-input')
  const [adInput, setAdInput] = useState<AdInput | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [workflowStatus, setWorkflowStatus] = useState<ExtendedCampaignStatus>('DRAFT')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stepIndex = stepOrder.indexOf(currentStep) + 1

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const checkWorkflowStatus = async () => {
      if (!campaignId || workflowStatus !== 'ANALYZING') return

      try {
        const res = await fetch(`/api/campaigns/${campaignId}`)
        if (!res.ok) throw new Error('Failed to fetch campaign status')

        const campaign = await res.json()
        setWorkflowStatus(campaign.status)

        if (campaign.status === 'DECISION_READY' || campaign.status === 'AWAITING_USER_ACTION') {
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
        }

        if (campaign.status === 'FAILED') {
          setErrorMessage('The workflow engine encountered a critical error during analysis.')
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    if (workflowStatus === 'ANALYZING') {
      interval = setInterval(checkWorkflowStatus, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <section className="rise-in grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="surface-card top-gradient p-8 text-white">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
            <Sparkles className="h-3.5 w-3.5" /> Simple Campaign Checkup
          </p>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Clear answers about what to fix, without marketing jargon.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/90 sm:text-base">
            We translate your ad results into plain steps anyone can follow.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              Open Dashboard
            </Link>
            <a href="#analysis-workflow" className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white">
              Start Analysis
            </a>
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Steps</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">What happens next</h2>
          <div className="mt-5 space-y-3">
            {stepOrder.map((step, i) => {
              const completed = i < stepIndex - 1 || (currentStep === 'results' && i === stepOrder.length - 1)
              const active = step === currentStep
              return (
                <div key={step} className="flex items-center gap-3">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${completed ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {i + 1}
                  </span>
                  <span className={`text-sm font-medium ${active ? 'text-slate-900' : 'text-slate-600'}`}>
                    {step === 'ad-input' && 'Tell us about your ad'}
                    {step === 'metrics' && 'Add basic results'}
                    {step === 'feedback' && 'Optional customer feedback'}
                    {step === 'results' && 'Get simple next steps'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="analysis-workflow" className="rise-in surface-card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Step {stepIndex} of 4</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Campaign Checkup</h2>
          </div>
          {workflowStatus === 'ANALYZING' && (
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running
            </span>
          )}
        </div>

        <div className="relative">
          {workflowStatus === 'ANALYZING' && (
            <div className="absolute inset-0 z-20 flex min-h-[420px] items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-slate-900">We are analyzing your results</p>
                <p className="mt-1 text-xs text-slate-500">You will get simple steps to improve.</p>
              </div>
            </div>
          )}

          {workflowStatus === 'FAILED' && (
            <div className="absolute inset-0 z-20 flex min-h-[420px] items-center justify-center rounded-2xl bg-red-50/95 backdrop-blur-sm">
              <div className="max-w-md px-6 text-center">
                <XCircle className="mx-auto h-9 w-9 text-red-600" />
                <p className="mt-3 text-sm font-semibold text-slate-900">Workflow failed</p>
                <p className="mt-1 text-xs text-red-700">{errorMessage}</p>
                <button onClick={handleReset} className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700">
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Record your decision</p>
                  <p className="mt-1 text-xs text-slate-500">This feedback is used to train collaboration and recommendation behavior.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => handleDecision('pause_ad')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                      Pause Campaign
                    </button>
                    <button onClick={() => handleDecision('refresh_creative')} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                      Refresh Creative <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Decision recorded successfully
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

