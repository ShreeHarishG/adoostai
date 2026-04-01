import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15, params is a Promise
) {
    try {
        const user = await getSessionUser()
        const { id } = await params

        const campaign = await prisma.campaign.findUnique({
            where: {
                id,
                userId: user.id // Ensure user owns the campaign
            },
            include: {
                decisions: {
                    orderBy: { createdAt: 'desc' }
                },
                analysisRuns: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                workflowLogs: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Compute latest run for convenience
        const latestRun = campaign.analysisRuns[0] ?? null
        // Extract completed agent steps for progress tracking
        const completedSteps = campaign.workflowLogs.map(log => log.step)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { analysisRuns, workflowLogs, ...campaignData } = campaign

        return NextResponse.json({ ...campaignData, latestRun, completedSteps })
    } catch (error) {
        console.error('Error fetching campaign:', error)
        return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionUser()
        const { id } = await params
        const data = await request.json()

        // Verify ownership
        const existing = await prisma.campaign.findUnique({
            where: { id, userId: user.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Determine data to update
        const updateData: {
            version: { increment: number };
            status?: string;
            metrics?: string;
            feedback?: string;
        } = {
            // Increment version on update automatically
            version: { increment: 1 }
        }

        // Safely update campaign-level fields only
        if (data.status) updateData.status = data.status
        if (data.metrics) updateData.metrics = JSON.stringify(data.metrics)
        if (data.feedback) updateData.feedback = JSON.stringify(data.feedback)

        const updatedCampaign = await prisma.campaign.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(updatedCampaign)
    } catch (error) {
        console.error('Error updating campaign:', error)
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }
}
