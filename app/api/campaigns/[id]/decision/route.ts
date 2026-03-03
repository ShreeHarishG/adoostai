import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { updateCollaborationProfile } from '@/core/collaboration-engine'

/**
 * POST /api/campaigns/[id]/decision
 *
 * Records user's decision on a recommendation.
 * Body: { userResponse: 'ACCEPTED' | 'REJECTED' | 'MODIFIED', notes?: string }
 *
 * Updates the latest PENDING RecommendationLog and triggers
 * collaboration profile recalculation.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionUser()
        const { id: campaignId } = await params

        // Parse body (App Router standard)
        const body = await request.json()
        const { userResponse, notes } = body as {
            userResponse?: string
            notes?: string
        }

        // Validate
        const validResponses = ['ACCEPTED', 'REJECTED', 'MODIFIED']
        if (!userResponse || !validResponses.includes(userResponse)) {
            return NextResponse.json(
                { error: `Invalid userResponse. Must be one of: ${validResponses.join(', ')}` },
                { status: 400 },
            )
        }

        // Verify campaign belongs to user
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId, userId: user.id },
        })
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Find latest PENDING recommendation for this campaign
        const latestRec = await prisma.recommendationLog.findFirst({
            where: { campaignId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        })

        if (!latestRec) {
            return NextResponse.json(
                { error: 'No pending recommendation found for this campaign' },
                { status: 404 },
            )
        }

        // Update RecommendationLog with user's decision
        const statusMap: Record<string, 'ACCEPTED' | 'REJECTED'> = {
            ACCEPTED: 'ACCEPTED',
            REJECTED: 'REJECTED',
            MODIFIED: 'REJECTED', // MODIFIED counts as override
        }

        await prisma.recommendationLog.update({
            where: { id: latestRec.id },
            data: {
                userResponse,
                status: statusMap[userResponse] ?? 'REJECTED',
            },
        })

        // Also store in DecisionHistory for backward compatibility
        await prisma.decisionHistory.create({
            data: {
                campaignId,
                actionTaken: userResponse === 'ACCEPTED'
                    ? latestRec.interventionType
                    : `USER_${userResponse}`,
                notes: notes ?? null,
            },
        })

        // Recalculate collaboration profile asynchronously
        // Fire-and-forget so the response isn't delayed
        updateCollaborationProfile(user.id).catch(err =>
            console.error('[Collaboration] Profile update failed:', err)
        )

        return NextResponse.json({
            success: true,
            decision: {
                recommendationId: latestRec.id,
                userResponse,
                interventionType: latestRec.interventionType,
            },
        })

    } catch (error) {
        console.error('[Decision API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to process decision' },
            { status: 500 },
        )
    }
}
