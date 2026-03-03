'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { AdInput } from '@/types'

interface AdInputFormProps {
  onSubmit: (adInput: AdInput) => void
}

export function AdInputForm({ onSubmit }: AdInputFormProps) {
  const [formData, setFormData] = useState<Partial<AdInput>>({
    platform: 'meta',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      formData.headline &&
      formData.description &&
      formData.adCopy &&
      formData.cta &&
      formData.targetAudience &&
      formData.objective &&
      formData.platform
    ) {
      onSubmit({
        id: `ad-${Date.now()}`,
        headline: formData.headline,
        description: formData.description,
        adCopy: formData.adCopy,
        cta: formData.cta,
        targetAudience: formData.targetAudience,
        objective: formData.objective,
        platform: formData.platform,
      })
    }
  }

  const inputClasses =
    'bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus-visible:ring-2 focus-visible:ring-green-500'

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-gray-900">Ad Information</CardTitle>
        <CardDescription className="text-gray-600">
          Enter your ad details for creative fatigue analysis
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">Ad Headline *</Label>
            <Input
              id="headline"
              className={inputClasses}
              placeholder="e.g., Get 50% Off Your First Order"
              value={formData.headline || ''}
              onChange={(e) =>
                setFormData({ ...formData, headline: e.target.value })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Ad Description *</Label>
            <Textarea
              id="description"
              className={inputClasses}
              placeholder="Brief description of your ad"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          {/* Ad Copy */}
          <div className="space-y-2">
            <Label htmlFor="adCopy">Full Ad Copy *</Label>
            <Textarea
              id="adCopy"
              className={inputClasses}
              placeholder="Complete ad text/body copy"
              rows={4}
              value={formData.adCopy || ''}
              onChange={(e) =>
                setFormData({ ...formData, adCopy: e.target.value })
              }
              required
            />
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Label htmlFor="cta">Call-to-Action (CTA) *</Label>
            <Input
              id="cta"
              className={inputClasses}
              placeholder="e.g., Shop Now, Learn More, Sign Up"
              value={formData.cta || ''}
              onChange={(e) =>
                setFormData({ ...formData, cta: e.target.value })
              }
              required
            />
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <select
              id="platform"
              className={`${inputClasses} flex h-10 w-full rounded-md border px-3 py-2 text-sm`}
              value={formData.platform}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  platform: e.target.value as any,
                })
              }
              required
            >
              <option value="meta">Meta (Facebook / Instagram)</option>
              <option value="google">Google Ads</option>
              <option value="youtube">YouTube</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience *</Label>
            <Input
              id="targetAudience"
              className={inputClasses}
              placeholder="e.g., Women 25-40 interested in fitness"
              value={formData.targetAudience || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetAudience: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <Label htmlFor="objective">Campaign Objective *</Label>
            <Input
              id="objective"
              className={inputClasses}
              placeholder="e.g., Lead Generation, Brand Awareness, Sales"
              value={formData.objective || ''}
              onChange={(e) =>
                setFormData({ ...formData, objective: e.target.value })
              }
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Continue to Performance Metrics
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
