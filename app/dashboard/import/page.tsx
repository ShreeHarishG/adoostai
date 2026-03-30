'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CloudUpload, Link2, PlugZap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

interface CampaignOption {
  id: string
  platform: string
  adType: string | null
}

type Tab = 'csv' | 'instagram' | 'meta'

export default function ImportCampaignPage() {
  const [tab, setTab] = useState<Tab>('csv')
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [instagramUrl, setInstagramUrl] = useState('')
  const [metaToken, setMetaToken] = useState('')
  const [metaAccount, setMetaAccount] = useState('')
  const [metaCampaignIds, setMetaCampaignIds] = useState('')

  useEffect(() => {
    const loadCampaigns = async () => {
      const res = await fetch('/api/campaigns')
      if (!res.ok) return
      const json = await res.json()
      setCampaigns(json)
      if (json.length) setCampaignId(json[0].id)
    }
    loadCampaigns().catch(console.error)
  }, [])

  const resetState = () => {
    setStatus(null)
    setError(null)
  }

  const handleCsvUpload = async () => {
    resetState()
    if (!campaignId) {
      setError('Select a campaign first.')
      return
    }
    if (!csvFile) {
      setError('Choose a CSV file to upload.')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('campaignId', campaignId)

      const res = await fetch('/api/data-ingestion/upload-csv', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'CSV upload failed.')

      setStatus(`Imported ${json.rowsProcessed} rows. Workflow started.`)
      if (json.errors?.length) {
        setError(`Parsed with warnings: ${json.errors.slice(0, 3).join(' | ')}`)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstagram = async () => {
    resetState()
    if (!campaignId) {
      setError('Select a campaign first.')
      return
    }
    if (!instagramUrl) {
      setError('Enter a valid Instagram URL.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/data-ingestion/instagram-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: instagramUrl, campaignId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Instagram fetch failed.')
      setStatus('Instagram metadata fetched. Preview available on campaign page.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMetaFetch = async () => {
    resetState()
    if (!campaignId) {
      setError('Select a campaign first.')
      return
    }
    if (!metaToken || !metaAccount) {
      setError('Access token and ad account ID are required.')
      return
    }

    setIsLoading(true)
    try {
      const campaignIds = metaCampaignIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

      const res = await fetch('/api/data-ingestion/fetch-meta-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: metaToken,
          adAccountId: metaAccount,
          campaignIds,
          campaignId,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Meta fetch failed.')
      setStatus(`Imported ${json.rowsProcessed} rows from Meta.`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Import campaign data</h1>
          <p className="mt-2 text-sm text-slate-600">Pick a source to ingest performance data and trigger the pipeline automatically.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">View campaigns</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select campaign</CardTitle>
          <CardDescription>Choose the campaign to attach imported data.</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
          >
            {campaigns.length === 0 && <option value="">No campaigns available</option>}
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.platform.toUpperCase()} - {campaign.adType || 'General'}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === 'csv' ? 'default' : 'outline'} onClick={() => setTab('csv')}>
          <CloudUpload className="h-4 w-4" /> CSV Upload
        </Button>
        <Button variant={tab === 'instagram' ? 'default' : 'outline'} onClick={() => setTab('instagram')}>
          <Link2 className="h-4 w-4" /> Instagram Link
        </Button>
        <Button variant={tab === 'meta' ? 'default' : 'outline'} onClick={() => setTab('meta')}>
          <PlugZap className="h-4 w-4" /> Meta API
        </Button>
      </div>

      <div className="mt-6 grid gap-4">
        {tab === 'csv' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV</CardTitle>
              <CardDescription>Use the Meta Ads Manager export. Required headers: date, impressions, clicks, spend, conversions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
              />
              <Button onClick={handleCsvUpload} disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Upload CSV'}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === 'instagram' && (
          <Card>
            <CardHeader>
              <CardTitle>Instagram link</CardTitle>
              <CardDescription>Paste a public Instagram post URL to extract creative metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  value={instagramUrl}
                  onChange={(event) => setInstagramUrl(event.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                />
              </div>
              <Button onClick={handleInstagram} disabled={isLoading}>
                {isLoading ? 'Fetching...' : 'Fetch Metadata'}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === 'meta' && (
          <Card>
            <CardHeader>
              <CardTitle>Meta Ads API</CardTitle>
              <CardDescription>Fetch daily metrics with an access token and campaign IDs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaToken">Access Token</Label>
                <Input
                  id="metaToken"
                  value={metaToken}
                  onChange={(event) => setMetaToken(event.target.value)}
                  placeholder="EAAB..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaAccount">Ad Account ID</Label>
                <Input
                  id="metaAccount"
                  value={metaAccount}
                  onChange={(event) => setMetaAccount(event.target.value)}
                  placeholder="act_123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaCampaigns">Campaign IDs (comma separated)</Label>
                <Input
                  id="metaCampaigns"
                  value={metaCampaignIds}
                  onChange={(event) => setMetaCampaignIds(event.target.value)}
                  placeholder="12021..., 12022..."
                />
              </div>
              <Button onClick={handleMetaFetch} disabled={isLoading}>
                {isLoading ? 'Fetching...' : 'Fetch Metrics'}
              </Button>
            </CardContent>
          </Card>
        )}

        {(status || error) && (
          <Card>
            <CardContent className="py-4">
              {status && <p className="text-sm font-medium text-emerald-700">{status}</p>}
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
