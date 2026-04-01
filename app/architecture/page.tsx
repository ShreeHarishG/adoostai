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
} from 'lucide-react'

interface ArchNode {
  id: string
  label: string
  description: string
  icon: typeof Bot
  color: string
  phase: string
}

const SYSTEM_NODES: ArchNode[] = [
  {
    id: 'data-sources',
    label: 'Data Ingestion Layer',
    description: 'CSV uploads, Instagram oEmbed links, and Meta API connectors feed raw campaign performance data into the system. Supports multi-format import with automatic parsing and validation.',
    icon: Database,
    color: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/10',
    phase: 'Input',
  },
  {
    id: 'signal-engine',
    label: 'Signal Engine',
    description: 'The Analysis Agent decomposes raw metrics into diagnostic signals (CTR slope, CPA acceleration, impression decay). The Fatigue Agent runs a weighted scoring model to quantify creative fatigue severity.',
    icon: TrendingUp,
    color: 'text-blue-400 border-blue-500/25 bg-blue-500/10',
    phase: 'Phase 1',
  },
  {
    id: 'normalizer',
    label: 'Signal Normalizer',
    description: 'Min-Max normalization scales all signal dimensions to [-1, 1] against historical campaign bounds, creating a standardized "fingerprint" that enables cross-campaign comparison.',
    icon: Layers,
    color: 'text-indigo-400 border-indigo-500/25 bg-indigo-500/10',
    phase: 'Phase 2',
  },
  {
    id: 'forecast',
    label: 'Forecast Engine',
    description: 'Statistical budget projection model (Python backend) that calculates burn rate, predicted spend exhaustion date, and budget risk level using time-series analysis.',
    icon: LineChart,
    color: 'text-purple-400 border-purple-500/25 bg-purple-500/10',
    phase: 'Phase 2',
  },
  {
    id: 'memory',
    label: 'Memory Engine',
    description: 'Searches past campaign signal profiles using Euclidean distance to find the most similar historical campaigns. Retrieves their outcomes to inform the current recommendation.',
    icon: Search,
    color: 'text-teal-400 border-teal-500/25 bg-teal-500/10',
    phase: 'Phase 3',
  },
  {
    id: 'debate',
    label: 'Multi-Agent Debate',
    description: 'Four specialist AI agents participate in a structured debate: the Analyst formulates hypotheses, the Critic challenges assumptions, the Memory agent provides precedents, and the Synthesizer renders a final verdict.',
    icon: MessageSquare,
    color: 'text-amber-400 border-amber-500/25 bg-amber-500/10',
    phase: 'Phase 3',
  },
  {
    id: 'collaboration',
    label: 'Collaboration Profile',
    description: 'Tracks how users respond to AI recommendations over time — accept rate, override rate, risk tolerance — and adapts future recommendations to match their decision-making style.',
    icon: Brain,
    color: 'text-pink-400 border-pink-500/25 bg-pink-500/10',
    phase: 'Phase 4',
  },
  {
    id: 'creative-engine',
    label: 'LLM Creative Engine',
    description: 'Powered by Google Gemini, dynamically generates context-aware ad copy recommendations (headlines, CTAs, structural changes) based on the diagnosed primary cause and campaign context.',
    icon: Sparkles,
    color: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10',
    phase: 'Phase 5',
  },
  {
    id: 'n8n',
    label: 'n8n Automation',
    description: 'Webhook-triggered autonomous action pipeline. Routes alerts to Slack/Teams, sends emails to media buyers, and can autonomously pause campaigns via Meta Ads API when AI confidence exceeds thresholds.',
    icon: Zap,
    color: 'text-orange-400 border-orange-500/25 bg-orange-500/10',
    phase: 'Phase 5',
  },
  {
    id: 'sse-stream',
    label: 'Real-Time SSE Stream',
    description: 'Server-Sent Events endpoint that streams each agent step live to the frontend as it happens. Enables the "live debate" visualization where users watch AI reasoning unfold in real time.',
    icon: Eye,
    color: 'text-red-400 border-red-500/25 bg-red-500/10',
    phase: 'Phase 6',
  },
  {
    id: 'decision-ui',
    label: 'Decision Support Dashboard',
    description: 'The final human-in-the-loop interface. Health scores, explainability timelines, ranked actions, what-if simulations, and creative suggestions — all designed to turn AI analysis into confident human decisions.',
    icon: Shield,
    color: 'text-violet-400 border-violet-500/25 bg-violet-500/10',
    phase: 'Output',
  },
]

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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* ─── Header ──────────────────────────── */}
      <section className="top-gradient rise-in rounded-2xl p-6 text-white sm:p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">System Architecture</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
          End-to-end pipeline: from raw campaign data to autonomous intervention.
          Each component is modular, testable, and designed for production deployment.
        </p>
      </section>

      {/* ─── Data Flow Summary ────────────────── */}
      <section className="surface-card p-6">
        <h2 className="text-lg font-bold text-white">Data Flow Pipeline</h2>
        <p className="mt-1 text-sm text-slate-400">Visual representation of how data moves through the system.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {FLOW_CONNECTIONS.map((conn, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="whitespace-nowrap rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
                {conn.from}
              </span>
              <div className="flex items-center gap-1 text-slate-500">
                <span className="text-[10px] uppercase tracking-widest">{conn.label}</span>
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

      {/* ─── Component Cards ──────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-white">System Components</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEM_NODES.map((node, i) => {
            const Icon = node.icon
            return (
              <article
                key={node.id}
                className="surface-card rise-in flex flex-col gap-4 p-5"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${node.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {node.phase}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{node.label}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{node.description}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ─── Tech Stack Summary ───────────────── */}
      <section className="surface-card p-6">
        <h2 className="text-lg font-bold text-white">Technology Stack</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Frontend', items: ['Next.js 16', 'React 19', 'Tailwind CSS v4', 'Recharts', 'Lucide Icons'] },
            { label: 'Backend', items: ['Next.js API Routes', 'Server-Sent Events', 'Prisma ORM', 'PostgreSQL'] },
            { label: 'AI / ML', items: ['Google Gemini API', 'Multi-agent debate system', 'Signal normalization', 'Memory retrieval'] },
            { label: 'Automation', items: ['n8n webhooks', 'Meta Ads API', 'Slack/Teams alerts', 'Autonomous pause'] },
          ].map((col) => (
            <div key={col.label}>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">{col.label}</p>
              <ul className="mt-2 space-y-1.5">
                {col.items.map((item) => (
                  <li key={item} className="text-sm text-slate-400">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Key Design Decisions ─────────────── */}
      <section className="surface-card p-6">
        <h2 className="text-lg font-bold text-white">Key Design Decisions</h2>
        <div className="mt-4 space-y-4">
          {[
            {
              title: 'Deterministic + LLM Hybrid',
              body: 'Core signal analysis and fatigue detection use deterministic algorithms for reliability and speed. The LLM (Gemini) is used only for creative generation where generative output adds genuine value. This means the system never hallucinates diagnostic data.',
            },
            {
              title: 'Multi-Agent Debate Architecture',
              body: 'Instead of a single monolithic model, four specialized agents debate the diagnosis. The Critic explicitly challenges the Analyst\'s findings, reducing confirmation bias. The Synthesizer resolves disagreements using evidence-weighted voting.',
            },
            {
              title: 'Human-in-the-Loop with Graceful Autonomy',
              body: 'The Collaboration Profile adapts to each user\'s risk tolerance. Conservative users get detailed explanations and manual approval prompts. Users who consistently accept AI recommendations can enable autonomous n8n actions.',
            },
            {
              title: 'Graceful Degradation',
              body: 'Every external dependency (forecast engine, Gemini API, n8n webhooks) is wrapped in try/catch with meaningful fallbacks. If the Python forecast service is down, analysis continues without it. If Gemini fails, hardcoded templates substitute.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
