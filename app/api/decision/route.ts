import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const user = await getSessionUser()
        const data = await request.json()

        // We expect { campaignId, actionTaken, notes }
        const { campaignId, actionTaken, notes } = data

        // Verify ownership
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId, userId: user.id }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Wrap in a transaction to update both Campaign and History synchronously
        const [decision] = await prisma.$transaction([
            prisma.decisionHistory.create({
                data: {
                    campaignId,
                    actionTaken,
                    notes: notes || null
                }
            }),
            prisma.campaign.update({
                where: { id: campaignId },
                data: {
                    status: 'COMPLETED',
                    decisionCompletedAt: new Date()
                }
            })
        ])

        return NextResponse.json(decision, { status: 201 })
    } catch (error) {
        console.error('Error creating decision history:', error)
        return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 })
    }
}
