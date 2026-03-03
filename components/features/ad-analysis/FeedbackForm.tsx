'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { FeedbackData } from '@/types'

interface FeedbackFormProps {
  onSubmit: (feedback: FeedbackData | undefined) => void
  onBack: () => void
  onSkip: () => void
}

export function FeedbackForm({
  onSubmit,
  onBack,
  onSkip,
}: FeedbackFormProps) {
  const [commentsText, setCommentsText] = useState('')
  const [sentiment, setSentiment] =
    useState<'positive' | 'negative' | 'neutral'>(
      'neutral'
    )

  const inputClasses =
    'bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus-visible:ring-2 focus-visible:ring-green-500'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentsText.trim()) {
      onSubmit(undefined)
      return
    }

    const recentComments = commentsText
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean)

    const lower = commentsText.toLowerCase()
    const commonThemes: string[] = []

    if (lower.includes('confus') || lower.includes('unclear'))
      commonThemes.push('Clarity issues')
    if (lower.includes('trust') || lower.includes('scam'))
      commonThemes.push('Trust concerns')
    if (lower.includes('price') || lower.includes('expensive'))
      commonThemes.push('Pricing objections')
    if (lower.includes('repetitive') || lower.includes('seen'))
      commonThemes.push('Ad fatigue')

    onSubmit({ recentComments, sentiment, commonThemes })
  }

  return (
    <Card className="bg-white text-gray-900">
      <CardHeader>
        <CardTitle>User Feedback (Optional)</CardTitle>
        <CardDescription className="text-gray-600">
          Add user comments to improve analysis accuracy
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sentiment */}
          <div className="space-y-2">
            <Label htmlFor="sentiment">Overall Sentiment</Label>
            <select
              id="sentiment"
              className={`${inputClasses} h-10 w-full rounded-md px-3 text-sm`}
              value={sentiment}
              onChange={(e) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setSentiment(e.target.value as any)
              }}
            >
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">User Comments</Label>
            <Textarea
              id="comments"
              rows={8}
              className={inputClasses}
              placeholder="One comment per line…"
              value={commentsText}
              onChange={(e) => setCommentsText(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Enter one comment per line
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button type="button" variant="ghost" onClick={onSkip} className="flex-1">
              Skip
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Analyze Ad
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
