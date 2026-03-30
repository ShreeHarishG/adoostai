export interface MetaInsightsRequest {
  accessToken: string
  adAccountId: string
  campaignIds: string[]
}

export interface MetaInsightRow {
  date_start?: string
  date_stop?: string
  impressions: string
  clicks: string
  spend: string
  reach?: string
  frequency?: string
  actions?: { action_type: string; value: string }[]
}

function buildInsightsUrl({ accessToken, adAccountId, campaignIds }: MetaInsightsRequest) {
  const base = `https://graph.facebook.com/v19.0/${adAccountId}/insights`
  const fields = [
    'date_start',
    'date_stop',
    'impressions',
    'clicks',
    'spend',
    'reach',
    'frequency',
    'actions',
  ].join(',')

  const filtering = campaignIds.length
    ? JSON.stringify([{ field: 'campaign.id', operator: 'IN', value: campaignIds }])
    : undefined

  const params = new URLSearchParams({
    access_token: accessToken,
    fields,
    time_increment: '1',
  })

  if (filtering) params.set('filtering', filtering)

  return `${base}?${params.toString()}`
}

function extractConversions(actions?: { action_type: string; value: string }[]): number {
  if (!actions) return 0
  return actions.reduce((sum, action) => {
    const type = action.action_type.toLowerCase()
    if (type.includes('conversion') || type.includes('purchase')) {
      return sum + Number(action.value || 0)
    }
    return sum
  }, 0)
}

export async function fetchMetaInsights(request: MetaInsightsRequest): Promise<MetaInsightRow[]> {
  const rows: MetaInsightRow[] = []
  let nextUrl: string | null = buildInsightsUrl(request)

  while (nextUrl) {
    const res = await fetch(nextUrl)

    if (res.status === 429) {
      throw new Error('Meta API rate limit reached. Please try again later.')
    }

    if (!res.ok) {
      throw new Error('Meta API request failed. Check token and permissions.')
    }

    const payload = (await res.json()) as {
      data: MetaInsightRow[]
      paging?: { next?: string }
    }

    rows.push(...payload.data)
    nextUrl = payload.paging?.next ?? null
  }

  return rows.map((row) => ({
    ...row,
    actions: row.actions,
  }))
}

export function mapMetaInsightToRow(row: MetaInsightRow) {
  return {
    date: row.date_start || row.date_stop || new Date().toISOString().slice(0, 10),
    impressions: row.impressions,
    clicks: row.clicks,
    spend: row.spend,
    conversions: extractConversions(row.actions),
    reach: row.reach,
    frequency: row.frequency,
  }
}
