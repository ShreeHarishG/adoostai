'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  Database,
  Eye,
  Layers,
  LineChart,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  FileText,
  Rocket,
  Globe,
  Settings
} from 'lucide-react'

interface ArchNode {
  id: string
  label: string
  description: string
  icon: any
  color: string
  phase: string
}

const FLOW_CONNECTIONS = [
  { from: 'Data Ingestion', to: 'Signal Engine', label: 'Raw metrics' },
  { from: 'Signal Engine', to: 'Normalizer', label: 'Signal profile' },
  { from: 'Normalizer', to: 'Forecast + Memory', label: 'Fingerprints' },
  { from: 'Forecast + Memory', to: 'Multi-Agent Debate', label: 'Context' },
  { from: 'Multi-Agent Debate', to: 'LLM Creative Engine', label: 'Diagnosis' },
  { from: 'LLM Creative Engine', to: 'n8n + Dashboard', label: 'Recommendations' },
]

export default function ArchitecturePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 text-slate-200">
      
      {/* ─── Header & Abstract ──────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold tracking-widest text-indigo-400 uppercase">Project Report</span>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          AdBoostAI System Architecture
        </h1>
        
        <div className="mt-4 surface-card p-6 sm:p-8 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Bot className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white">Executive Summary</h2>
            </div>
            <p className="text-lg text-slate-300 leading-relaxed mb-4">
              AdBoostAI is an intelligent platform designed to combat ad fatigue and optimize marketing budgets autonomously. 
              Modern digital advertising campaigns often fail due to sudden shifts in performance (like rising Cost Per Acquisition) 
              that go unnoticed until budgets are already wasted.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              This system solves that problem by integrating a <strong>Multi-Agent AI Debate Engine</strong>. Instead of simple alerts, 
              AdBoostAI ingests raw campaign data, normalizes the metrics, and uses specialized AI agents to "debate" the underlying causes of performance drops.
              It then outputs proactive creative suggestions and can even autonomously pause failing ads to protect the user's budget.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Project Status ───────────────────────────── */}
      <section className="surface-card p-6 sm:p-8 rounded-2xl relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Target className="w-5 h-5 text-emerald-400" /> 
              Project Completion Status
            </h2>
            <p className="text-sm text-slate-400 mt-1">Tracking the development roadmap and current milestone phase.</p>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-emerald-400">25% Completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-1/4 rounded-full relative">
            <div className="absolute inset-0 bg-white/20 blur-[2px] animate-pulse"></div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold">Phase 1: Ingestion</span>
            </div>
            <p className="text-xs text-slate-400">Database schemas, Meta API integration, basic routing.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold">Phase 2: UI Foundation</span>
            </div>
            <p className="text-xs text-slate-400">Dashboard routing, core layout, authentication prep, component library.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 animate-pulse">
              <Zap className="w-5 h-5" />
              <span className="font-bold text-amber-500">Phase 3: AI Engine (Current)</span>
            </div>
            <p className="text-xs text-slate-400">Multi-agent logic, memory retrieval, prompt tuning.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-600">
              <Globe className="w-5 h-5" />
              <span className="font-bold">Phase 4: Output</span>
            </div>
            <p className="text-xs text-slate-600">n8n webhooks, automated actions, analytics generation.</p>
          </div>
        </div>
      </section>

      {/* ─── Multi-Agent Deep Dive ────────────────────── */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Brain className="w-6 h-6 text-amber-400" />
            The Multi-Agent AI System
          </h2>
          <p className="text-slate-400 max-w-3xl">
            The core intelligence of AdBoostAI relies on a localized "debate" between four distinct AI personalities. 
            By challenging each other, these agents drastically reduce AI hallucinations and confirmation bias, ensuring the final diagnosis is statistically sound.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="surface-card p-6 rounded-2xl border-t-4 border-t-blue-500 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. The Analyst</h3>
            <p className="text-sm text-slate-400">
              Looks at the raw metrics to form an initial hypothesis. It identifies what went wrong (e.g., "CTR dropped by 15% quickly, indicating creative fatigue").
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl border-t-4 border-t-red-500 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. The Critic</h3>
            <p className="text-sm text-slate-400">
              Actively tries to disprove the Analyst. It checks for false positives, such as identifying if the drop is actually due to seasonality or a tracking pixel outage.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl border-t-4 border-t-teal-500 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. The Memory Agent</h3>
            <p className="text-sm text-slate-400">
              Scans historical campaign data using vector similarity to find past situations with similar metric signatures, bringing context on what interventions worked previously.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl border-t-4 border-t-purple-500 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">4. The Synthesizer</h3>
            <p className="text-sm text-slate-400">
              Reads the entire debate, weighs the evidence, and outputs a final, structured JSON diagnosis. It guarantees actionable conclusions for the frontend to render.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Data Flow Summary ────────────────── */}
      <section className="surface-card p-6 sm:p-8 rounded-2xl">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Layers className="w-6 h-6 text-indigo-400" />
          Technical Pipeline Architecture
        </h2>
        <p className="text-sm text-slate-400 mb-8">End-to-end data route mapping from data origin to external actions.</p>

        <div className="my-8 flex justify-center rounded-xl bg-white/[0.02] p-4 sm:p-8 border border-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/adboostai_full_platform.svg" 
            alt="AdBoostAI Platform Architecture Diagram" 
            className="h-auto w-full max-w-4xl object-contain drop-shadow-2xl"
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
          {FLOW_CONNECTIONS.map((conn, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="whitespace-nowrap rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
                {conn.from}
              </span>
              <div className="flex items-center gap-1 text-slate-500">
                <span className="text-[10px] uppercase tracking-widest hidden sm:inline-block">{conn.label}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
              {i === FLOW_CONNECTIONS.length - 1 && (
                <span className="whitespace-nowrap rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  {conn.to}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Future Scope ─────────────────────── */}
      <section className="grid sm:grid-cols-12 gap-8">
        <div className="sm:col-span-5 surface-card p-8 rounded-2xl flex flex-col justify-center border border-indigo-500/20 bg-gradient-to-br from-indigo-900/20 to-transparent">
          <Rocket className="w-12 h-12 text-indigo-400 mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Future Scope & Scalability</h2>
          <p className="text-slate-300">
            AdBoostAI is architected with modularity in mind. While the current MVP focuses on Meta ad campaigns and text-based diagnosis, the framework allows for massive expansion into true autonomous marketing management.
          </p>
        </div>

        <div className="sm:col-span-7 grid gap-4">
          <div className="surface-card p-5 rounded-xl border border-white/5 flex gap-4">
            <div className="p-3 bg-white/5 rounded-lg h-min">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-white">Cross-Platform Integration</h4>
              <p className="text-sm text-slate-400 mt-1">Expanding API connectors to ingest and analyze data simultaneously from Google Ads, TikTok Ads, and LinkedIn, creating a holistic multi-channel tracking system.</p>
            </div>
          </div>
          
          <div className="surface-card p-5 rounded-xl border border-white/5 flex gap-4">
            <div className="p-3 bg-white/5 rounded-lg h-min">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white">Video & Image Generation</h4>
              <p className="text-sm text-slate-400 mt-1">Moving beyond text copy generation to integrate image and video generative models (like Stable Diffusion / Sora), automatically constructing new ad creatives based on winning semantic traits.</p>
            </div>
          </div>

          <div className="surface-card p-5 rounded-xl border border-white/5 flex gap-4">
            <div className="p-3 bg-white/5 rounded-lg h-min">
              <Bot className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h4 className="font-bold text-white">Reinforcement Learning Profile</h4>
              <p className="text-sm text-slate-400 mt-1">A real-time feedback loop where the AI learns from the user&apos;s manual overrides. If a user rejects an AI suggestion, the system refines its future thresholds using active reinforcement learning.</p>
            </div>
          </div>

          <div className="surface-card p-5 rounded-xl border border-white/5 flex gap-4">
            <div className="p-3 bg-white/5 rounded-lg h-min">
              <LineChart className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-white">Predictive LTV Modeling</h4>
              <p className="text-sm text-slate-400 mt-1">Integrating CRM data (Stripe, HubSpot) to optimize campaigns not just for immediate CPA, but for predictable long-term Life-Time Value of acquiring the user.</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
