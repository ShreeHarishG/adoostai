import { NextResponse } from 'next/server'
import { processCampaignWorkflow } from '@/lib/workflow-engine'

// Now an async orchestrator endpoint
export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { campaignId } = data

        if (!campaignId) {
            return NextResponse.json(
                { error: 'Missing campaignId' },
                { status: 400 }
            )
        }

        // 1. Fire and Forget the workflow engine (Asynchronous)
        // NOTE: In production serverless environments (like Vercel functions),
        // you would typically use an Upstash Queue or similar here because 
        // dangling promises are killed after the request ends. 
        // However, for Node/Local/NextJS dev servers, this simulates it perfectly.
        processCampaignWorkflow(campaignId).catch(console.error);

        // 3. Return immediately to unblock client
        return NextResponse.json({
            success: true,
            status: 'ANALYZING',
            message: 'Workflow started'
        }, { status: 202 })

    } catch (error) {
        console.error('Error starting analysis workflow:', error)
        return NextResponse.json(
            { error: 'Failed to start analysis workflow' },
            { status: 500 }
        )
    }
}
