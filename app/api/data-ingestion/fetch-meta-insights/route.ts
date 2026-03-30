import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { fetchMetaInsights, mapMetaInsightToRow } from '@/lib/meta-api-client'
import { buildMetricsFromSnapshots, normalizePerformanceRow } from '@/lib/performance-normalizer'
import { processCampaignWorkflow } from '@/lib/workflow-engine'

export async function POST(request: Request) {
  let importedFileId: string | null = null
  try {
    const user = await getSessionUser()
    const body = await request.json()
    const { accessToken, adAccountId, campaignIds, campaignId } = body as {
      accessToken?: string
      adAccountId?: string
      campaignIds?: string[]
      campaignId?: string
    }

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
    }

    if (!accessToken || !adAccountId) {
      return NextResponse.json({ error: 'Access token and Ad Account ID are required.' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId, userId: user.id },
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
    }

    const importedFile = await prisma.importedFile.create({
      data: {
        userId: user.id,
        fileName: `meta_api_${adAccountId}`,
        type: 'meta_api',
        status: 'uploaded',
      },
    })
    importedFileId = importedFile.id

    const insights = await fetchMetaInsights({
      accessToken,
      adAccountId,
      campaignIds: campaignIds ?? [],
    })

    const normalizedRows = insights.map((row) => normalizePerformanceRow(mapMetaInsightToRow(row)))

    if (normalizedRows.length === 0) {
      await prisma.importedFile.update({
        where: { id: importedFile.id },
        data: { status: 'error', errorMsg: 'No insights returned from Meta.' },
      })
      return NextResponse.json({ error: 'No insights returned from Meta.' }, { status: 400 })
    }

    await prisma.performanceSnapshot.createMany({
      data: normalizedRows.map((row) => ({
        campaignId,
        sourceType: 'meta_api',
        sourceReference: adAccountId,
        date: row.date,
        impressions: row.impressions,
        clicks: row.clicks,
        spend: row.spend,
        conversions: row.conversions,
        reach: row.reach ?? null,
        frequency: row.frequency ?? null,
      })),
    })

    const metrics = buildMetricsFromSnapshots(normalizedRows)
    await prisma.campaign.update({
      where: { id: campaignId, userId: user.id },
      data: {
        metrics: JSON.stringify(metrics),
      },
    })

    await prisma.importedFile.update({
      where: { id: importedFile.id },
      data: {
        status: 'parsed',
        errorMsg: null,
      },
    })

    processCampaignWorkflow(campaignId).catch(console.error)

    return NextResponse.json({
      campaignId,
      rowsProcessed: normalizedRows.length,
      status: 'ANALYZING',
      errors: [],
    })
  } catch (error) {
    console.error('[Meta Fetch] Error:', error)
    if (importedFileId) {
      await prisma.importedFile.update({
        where: { id: importedFileId },
        data: {
          status: 'error',
          errorMsg: (error as Error).message,
        },
      })
    }
    return NextResponse.json(
      { error: 'Failed to fetch Meta insights. Please verify token and permissions.' },
      { status: 400 },
    )
  }
}
