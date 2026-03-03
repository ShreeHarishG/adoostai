import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

/**
 * PATCH /api/campaigns/[id]/suggestions
 *
 * Marks a creative suggestion as "applied" by the user.
 * Body: { suggestionId: string }
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionUser()
        const { id: campaignId } = await params
        const { suggestionId } = await request.json() as { suggestionId?: string }

        if (!suggestionId) {
            return NextResponse.json({ error: 'Missing suggestionId' }, { status: 400 })
        }

        // Verify campaign belongs to user
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId, userId: user.id },
        })
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Mark suggestion as applied
        const updated = await prisma.creativeSuggestion.update({
            where: { id: suggestionId, campaignId },
            data: { applied: true },
        })

        return NextResponse.json({ success: true, suggestion: updated })
    } catch (error) {
        console.error('[Suggestions API] Error:', error)
        return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 })
    }
}
