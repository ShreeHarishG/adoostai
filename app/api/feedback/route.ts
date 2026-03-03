import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const user = await getSessionUser()
        const data = await request.json()

        // { campaignId, feedback }
        const { campaignId, feedback } = data

        // Verify ownership
        const existing = await prisma.campaign.findUnique({
            where: { id: campaignId, userId: user.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Update feedback and bump version
        const updatedCampaign = await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                feedback: JSON.stringify(feedback),
                version: { increment: 1 }
            }
        })

        return NextResponse.json(updatedCampaign)
    } catch (error) {
        console.error('Error updating feedback:', error)
        return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }
}
