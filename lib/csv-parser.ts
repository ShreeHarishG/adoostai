import { parse } from 'csv-parse/sync'
import { normalizePerformanceRow, type NormalizedSnapshot } from './performance-normalizer'

const REQUIRED_FIELDS = ['date', 'impressions', 'clicks', 'spend', 'conversions'] as const

type CanonicalKey = typeof REQUIRED_FIELDS[number] | 'reach' | 'frequency'

const HEADER_ALIASES: Record<string, CanonicalKey> = {
  date: 'date',
  day: 'date',
  reportingdate: 'date',
  impressions: 'impressions',
  impression: 'impressions',
  clicks: 'clicks',
  click: 'clicks',
  amountspent: 'spend',
  spend: 'spend',
  cost: 'spend',
  conversions: 'conversions',
  purchases: 'conversions',
  results: 'conversions',
  reach: 'reach',
  frequency: 'frequency',
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function parseCsvToSnapshots(buffer: Buffer): {
  rows: NormalizedSnapshot[]
  errors: string[]
} {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]

  if (!records.length) {
    throw new Error('CSV is empty')
  }

  const headerMap: Record<string, CanonicalKey> = {}
  for (const rawHeader of Object.keys(records[0])) {
    const normalized = normalizeHeader(rawHeader)
    if (HEADER_ALIASES[normalized]) {
      headerMap[rawHeader] = HEADER_ALIASES[normalized]
    }
  }

  const missing = REQUIRED_FIELDS.filter(
    (key) => !Object.values(headerMap).includes(key),
  )
  if (missing.length > 0) {
    throw new Error(`Missing required headers: ${missing.join(', ')}`)
  }

  const rows: NormalizedSnapshot[] = []
  const errors: string[] = []

  records.forEach((record, index) => {
    try {
      const mapped: Record<string, string> = {}
      for (const [rawKey, value] of Object.entries(record)) {
        const canonical = headerMap[rawKey]
        if (canonical) {
          mapped[canonical] = value
        }
      }

      const normalized = normalizePerformanceRow({
        date: mapped.date,
        impressions: mapped.impressions,
        clicks: mapped.clicks,
        spend: mapped.spend,
        conversions: mapped.conversions,
        reach: mapped.reach ?? null,
        frequency: mapped.frequency ?? null,
      })

      rows.push(normalized)
    } catch (err) {
      errors.push(`Row ${index + 2}: ${(err as Error).message}`)
    }
  })

  return { rows, errors }
}
