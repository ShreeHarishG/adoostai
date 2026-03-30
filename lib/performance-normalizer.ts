export interface RawPerformanceRow {
  date: string
  impressions: number | string
  clicks: number | string
  spend: number | string
  conversions: number | string
  reach?: number | string | null
  frequency?: number | string | null
}

export interface NormalizedSnapshot {
  date: Date
  impressions: number
  clicks: number
  spend: number
  conversions: number
  reach?: number | null
  frequency?: number | null
}

function toNumber(value: number | string | undefined | null, fallback = 0): number {
  if (value == null) return fallback
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizePerformanceRow(row: RawPerformanceRow): NormalizedSnapshot {
  const date = new Date(row.date)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${row.date}`)
  }

  const impressions = Math.max(0, Math.round(toNumber(row.impressions)))
  const clicks = Math.max(0, Math.round(toNumber(row.clicks)))
  const spend = Math.max(0, toNumber(row.spend))
  const conversions = Math.max(0, Math.round(toNumber(row.conversions)))
  const reach = row.reach != null ? Math.max(0, Math.round(toNumber(row.reach))) : null
  const frequency = row.frequency != null ? Math.max(0, toNumber(row.frequency)) : null

  return {
    date,
    impressions,
    clicks,
    spend,
    conversions,
    reach,
    frequency,
  }
}

export function buildMetricsFromSnapshots(rows: NormalizedSnapshot[]) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.impressions += row.impressions
      acc.clicks += row.clicks
      acc.spend += row.spend
      acc.conversions += row.conversions
      if (row.reach != null) acc.reach += row.reach
      if (row.frequency != null) acc.frequency += row.frequency
      acc.count += 1
      return acc
    },
    { impressions: 0, clicks: 0, spend: 0, conversions: 0, reach: 0, frequency: 0, count: 0 },
  )

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0
  const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0
  const roas = totals.spend > 0 ? (totals.conversions * 50) / totals.spend : 0
  const frequency = totals.count > 0 ? totals.frequency / totals.count : 1

  return {
    impressions: totals.impressions,
    clicks: totals.clicks,
    ctr,
    spend: totals.spend,
    conversions: totals.conversions,
    cpc,
    cpm,
    cpa,
    roas,
    frequency,
    durationDays: Math.max(1, rows.length),
  }
}
