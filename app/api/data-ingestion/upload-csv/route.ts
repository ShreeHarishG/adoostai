import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { parseCsvToSnapshots } from '@/lib/csv-parser'
import { buildMetricsFromSnapshots } from '@/lib/performance-normalizer'
import { processCampaignWorkflow } from '@/lib/workflow-engine'

export async function POST(request: Request) {
  let importedFileId: string | null = null
  try {
    const user = await getSessionUser()
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const campaignId = formData.get('campaignId')?.toString()

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'CSV file is required.' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a CSV.' }, { status: 400 })
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
        fileName: file.name,
        type: 'csv_performance',
        status: 'uploaded',
      },
    })
    importedFileId = importedFile.id

    const buffer = Buffer.from(await file.arrayBuffer())
    const { rows, errors } = parseCsvToSnapshots(buffer)

    if (rows.length === 0) {
      await prisma.importedFile.update({
        where: { id: importedFile.id },
        data: {
          status: 'error',
          errorMsg: errors.length ? errors.join(' | ') : 'No valid rows found in CSV',
        },
      })
      return NextResponse.json({ error: 'No valid rows found in CSV.' }, { status: 400 })
    }

    await prisma.performanceSnapshot.createMany({
      data: rows.map((row) => ({
        campaignId,
        sourceType: 'csv',
        sourceReference: file.name,
        date: row.date,
        impressions: row.impressions,
        clicks: row.clicks,
        spend: row.spend,
        conversions: row.conversions,
        reach: row.reach ?? null,
        frequency: row.frequency ?? null,
      })),
    })

    const metrics = buildMetricsFromSnapshots(rows)
    await prisma.campaign.update({
      where: { id: campaignId, userId: user.id },
      data: {
        metrics: JSON.stringify(metrics),
      },
    })

    await prisma.importedFile.update({
      where: { id: importedFileId },
      data: {
        status: 'parsed',
        errorMsg: errors.length ? errors.join(' | ') : null,
      },
    })

    processCampaignWorkflow(campaignId).catch(console.error)

    return NextResponse.json({
      campaignId,
      rowsProcessed: rows.length,
      status: 'ANALYZING',
      errors,
    })
  } catch (error) {
    console.error('[CSV Upload] Error:', error)
    if (importedFileId) {
      await prisma.importedFile.update({
        where: { id: importedFileId },
        data: { status: 'error', errorMsg: (error as Error).message },
      })
    }
    return NextResponse.json({ error: 'CSV ingestion failed. Please verify your file format.' }, { status: 500 })
  }
}
