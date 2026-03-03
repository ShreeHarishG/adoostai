'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { AdInputForm } from '@/components/features/ad-analysis/AdInputForm'
import { PerformanceMetricsForm } from '@/components/features/ad-analysis/PerformanceMetricsForm'
import { FeedbackForm } from '@/components/features/ad-analysis/FeedbackForm'
import { AnalysisResults } from '@/components/features/ad-analysis/AnalysisResults'
import { Badge } from '@/components/ui/Badge'
import {
  AdInput,
  PerformanceMetrics,
  FeedbackData,
  AnalysisResult,
  CampaignStatus,
} from '@/types'

type Step = 'ad-input' | 'metrics' | 'feedback' | 'results'

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('ad-input')
  const [adInput, setAdInput] = useState<AdInput | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [workflowStatus, setWorkflowStatus] = useState<CampaignStatus>('DRAFT')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Polling Effect for Async Workflow Pipeline
  useEffect(() => {
    let interval: NodeJS.Timeout

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

          // Map AnalysisRun response to AnalysisResult props
          const recommendations = JSON.parse(run.recommendationOutput)
          const fatigueOutput = JSON.parse(run.fatigueOutput)

          setAnalysisResult({
            adId: campaign.id,
            timestamp: new Date(run.createdAt),
            summary: 'Workflow Engine Completed Analysis',
            fatigueDiagnosis: {
              level: 'moderate', // Deprecated in favor of severityLevel
              severityLevel: run.severityLevel,
              impactScore: run.fatigueScore || 0,
              confidence: run.confidenceScore || 0,
              primaryReasons: [fatigueOutput.primaryIssue || 'Unknown'],
            },
            recommendations: [], // Deprecated string support
            structuredRecommendations: recommendations,
          })
          setCurrentStep('results')
        } else if (campaign.status === 'FAILED') {
          setErrorMessage('The workflow engine encountered a critical error during analysis.')
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    if (workflowStatus === 'ANALYZING') {
      interval = setInterval(checkWorkflowStatus, 2000) // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [campaignId, workflowStatus])


  const handleAdInputSubmit = (data: typeof adInput) => {
    setAdInput(data)

    // Auto-fill some mocked realistic data to save user typings 
    // in this prototype version
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
      durationDays: 14
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
      // 1. Create a draft campaign
      const resCampaign = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: adInput.platform,
          adType: 'Standard Ad',
          metrics,
          feedback
        })
      })
      const campaign = await resCampaign.json()
      setCampaignId(campaign.id)

      // 2. Fire the async analysis workflow queue
      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id })
      })

      // UI now waits for the useEffect polling to catch 'DECISION_READY'
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
          notes: 'User interacted via workflow UI'
        })
      })
      // Update local state to hide buttons after decision
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

  const getStepNumber = (step: Step): number => {
    const steps: Step[] = ['ad-input', 'metrics', 'feedback', 'results']
    return steps.indexOf(step) + 1
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AdBoostAI</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Workflow Engine Active
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        {currentStep !== 'results' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {getStepNumber(currentStep)} of 4
              </span>
              <span className="text-sm text-gray-500">
                {currentStep === 'ad-input' && 'Ad Information'}
                {currentStep === 'metrics' && 'Performance Metrics'}
                {currentStep === 'feedback' && 'User Feedback'}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(getStepNumber(currentStep) / 4) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Hero Section */}
        {currentStep === 'ad-input' && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Intelligent Campaign Diagnosis
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Submit your ad telemetry. Our multi-agent workflow will diagnose fatigue, score confidence, and generate structured decisions.
            </p>
          </div>
        )}

        {/* Step Components */}
        <div className="max-w-3xl mx-auto relative">

          {/* Global Loading / Polling Overlay */}
          {workflowStatus === 'ANALYZING' && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl border-2 border-green-100 shadow-xl min-h-[400px]">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-200 rounded-full blur-xl animate-pulse" />
                <div className="bg-white p-4 rounded-full relative shadow-md">
                  <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Workflow Engine Running</h3>
              <div className="flex flex-col gap-2 w-64 text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" /> <span>Analysis Agent complete</span>
                </div>
                <div className="flex items-center gap-2 animate-pulse text-gray-900">
                  <Loader2 className="h-4 w-4 animate-spin" /> <span>Decision Engine processing...</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <div className="h-4 w-4 border-2 rounded-full border-gray-300" /> <span>Generating recommendations</span>
                </div>
              </div>
            </div>
          )}

          {/* Global Error Overlay */}
          {workflowStatus === 'FAILED' && (
            <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl border-2 border-red-200 shadow-lg min-h-[400px] p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Workflow Failed</h3>
              <p className="text-red-700 mb-6">{errorMessage}</p>
              <button onClick={handleReset} className="px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors font-medium">Try Again</button>
            </div>
          )}

          {currentStep === 'ad-input' && (
            <AdInputForm onSubmit={handleAdInputSubmit} />
          )}

          {currentStep === 'metrics' && (
            <PerformanceMetricsForm
              onSubmit={handleMetricsSubmit}
              onBack={() => setCurrentStep('ad-input')}
            />
          )}

          {currentStep === 'feedback' && workflowStatus !== 'ANALYZING' && workflowStatus !== 'FAILED' && (
            <FeedbackForm
              onSubmit={handleFeedbackSubmit}
              onBack={() => setCurrentStep('metrics')}
              onSkip={() => handleFeedbackSubmit(undefined)}
            />
          )}

          {currentStep === 'results' && analysisResult && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalysisResults result={analysisResult} onReset={handleReset} />

              {/* Decision Flow UI */}
              {workflowStatus !== 'COMPLETED' ? (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                        Human Approval Required <Badge variant="info" className="bg-blue-100 text-blue-700">Step 3 Prep</Badge>
                      </h3>
                      <p className="text-sm text-gray-600 max-w-sm">Review the top-level suggested action from the Decision Engine. Log your decision to train the automation layer.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleDecision('pause_ad')}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        Pause Ad
                      </button>
                      <button
                        onClick={() => handleDecision('refresh_creative')}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                      >
                        Refresh Creative <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Decision Recorded</h3>
                  <p className="text-sm text-gray-600">The workflow history has been updated for Step 3 learning pipelines.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
