import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getSessionUser()

        const campaigns = await prisma.campaign.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json(campaigns)
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const user = await getSessionUser()
        const data = await request.json()

        // We expect the client to send the initial ad data to "draft" a campaign
        const { platform, adType, metrics, feedback } = data

        const campaign = await prisma.campaign.create({
            data: {
                userId: user.id,
                platform: platform || 'unknown',
                adType: adType || null,
                metrics: metrics ? JSON.stringify(metrics) : '{}',
                feedback: feedback ? JSON.stringify(feedback) : null,
                status: 'draft',
            }
        })

        return NextResponse.json(campaign, { status: 201 })
    } catch (error) {
        console.error('Error creating campaign:', error)
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }
}
