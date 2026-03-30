'use client'

import React from 'react'
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Sparkles,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AnalysisResult } from '@/types'

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function AnalysisResults({ result, onReset }: AnalysisResultsProps) {
  const levelStyles: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-green-100 text-green-700 border-green-200',
  }

  const priorityStyles: Record<number, string> = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-blue-100 text-blue-700',
  }

  const levelIcons: Record<string, React.ReactElement> = {
    CRITICAL: <XCircle className="h-8 w-8 text-red-600" />,
    HIGH: <AlertCircle className="h-8 w-8 text-orange-600" />,
    MEDIUM: <AlertTriangle className="h-8 w-8 text-yellow-600" />,
    LOW: <CheckCircle className="h-8 w-8 text-green-600" />,
  }

  const diag = result.fatigueDiagnosis
  const severity = diag.severityLevel || 'LOW'
  const primaryIssue = diag.primaryReasons[0]
  const friendlyPrimary =
    !primaryIssue || primaryIssue === 'NONE'
      ? 'No major issues detected. Keep monitoring.'
      : primaryIssue

  const structured = result.structuredRecommendations ?? []
  const hasStructured = structured.length > 0
  const fallbackRecommendations = [
    {
      type: 'creative',
      text: 'Try a fresh headline or visual to keep the ad feeling new.',
      priority: 1,
    },
    {
      type: 'budget',
      text: 'Hold spend steady for 48 hours and watch CTR and CPA movement.',
      priority: 2,
    },
    {
      type: 'cta',
      text: 'Clarify the next step with a stronger call‑to‑action.',
      priority: 3,
    },
  ]
  const recommendations = hasStructured ? structured : fallbackRecommendations

  return (
    <div className="space-y-6 text-gray-900">
      {/* Diagnosis */}
      <Card className="bg-white border-2 overflow-hidden">
        <div className={`h-2 w-full ${severity === 'CRITICAL' ? 'bg-red-500' : severity === 'HIGH' ? 'bg-orange-500' : severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`} />
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Campaign Health Summary</CardTitle>
              <CardDescription className="text-gray-600 mt-1 flex items-center gap-1">
                <Activity className="h-4 w-4" /> Analyzed at {result.timestamp.toLocaleTimeString()}
              </CardDescription>
            </div>
            {levelIcons[severity]}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Severity Level</span>
              <Badge variant="default" className={`${levelStyles[severity]} text-sm px-3 py-1`}>
                {severity}
              </Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Confidence Score</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">{diag.confidence}%</span>
                <span className="text-xs text-gray-500 uppercase">{diag.confidence > 80 ? 'High' : diag.confidence > 60 ? 'Medium' : 'Low'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">What this means</h4>
            <div className="flex gap-2 text-sm text-gray-700 items-center">
              <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{friendlyPrimary}</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Creative fatigue score</span>
              <span className="font-bold text-gray-900">
                {diag.impactScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${diag.impactScore > 70 ? 'bg-red-500' : diag.impactScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{
                  width: `${diag.impactScore}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Simple next steps</CardTitle>
          <CardDescription className="text-gray-600">
            Clear actions you can take right now.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 border rounded-xl hover:border-gray-400 transition bg-white shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-3 items-center">
                  <span className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-700">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {rec.type}
                    </span>
                  </div>
                </div>
                <Badge className={priorityStyles[rec.priority] || priorityStyles[3]}>
                  Priority {rec.priority}
                </Badge>
              </div>
              <p className="text-gray-800 font-medium mt-3 ml-11">
                {rec.text}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1 py-6 border-gray-300" onClick={onReset}>
          Analyze Another Ad
        </Button>
        <Button className="flex-1 py-6 bg-gray-900 hover:bg-gray-800 text-white">
          <Lightbulb className="h-4 w-4 mr-2" /> Get Creative Ideas
        </Button>
      </div>
    </div>
  )
}
