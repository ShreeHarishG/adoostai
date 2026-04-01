import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { fetchInstagramMetadata, detectInstagramUrlType, extractInstagramUsername } from '@/lib/instagram-parser'

export async function POST(request: Request) {
  let importedFileId: string | null = null
  try {
    const user = await getSessionUser()
    const body = await request.json()
    const { url, campaignId } = body as { url?: string; campaignId?: string }

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
    }

    if (!url) {
      return NextResponse.json({ error: 'Instagram URL is required.' }, { status: 400 })
    }

    const urlType = detectInstagramUrlType(url)

    if (urlType === 'invalid') {
      return NextResponse.json(
        { error: 'Invalid Instagram URL. Please use a post link (instagram.com/p/... or /reel/...).' },
        { status: 400 },
      )
    }

    if (urlType === 'account') {
      const username = extractInstagramUsername(url)
      return NextResponse.json({
        urlType: 'account',
        username,
        message: `Account-level URLs like @${username} require individual post links. Paste your 3 best-performing post links to analyse those creatives. For account-level scraping, configure an Apify or RapidAPI data partner.`,
      })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId, userId: user.id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const importedFile = await prisma.importedFile.create({
      data: {
        userId: user.id,
        fileName: url,
        type: 'instagram_link',
        status: 'uploaded',
      },
    })
    importedFileId = importedFile.id

    const metadata = await fetchInstagramMetadata(url)

    const record = await prisma.importedContent.create({
      data: {
        campaignId,
        sourceType: 'instagram',
        sourceReference: url,
        caption: metadata.caption,
        hashtags: metadata.hashtags,
        mediaType: metadata.mediaType,
        thumbnailUrl: metadata.thumbnailUrl,
      },
    })

    await prisma.importedFile.update({
      where: { id: importedFile.id },
      data: { status: 'parsed', errorMsg: null },
    })

    return NextResponse.json({
      id: record.id,
      ...metadata,
    })
  } catch (error) {
    console.error('[Instagram Link] Error:', error)
    if (importedFileId) {
      await prisma.importedFile.update({
        where: { id: importedFileId },
        data: { status: 'error', errorMsg: (error as Error).message },
      })
    }
    return NextResponse.json(
      { error: 'Unable to fetch Instagram metadata. Ensure the link is valid and public.' },
      { status: 400 },
    )
  }
}
