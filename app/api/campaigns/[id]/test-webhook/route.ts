import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const webhookUrl = process.env.N8N_WEBHOOK_URL
        
        if (!webhookUrl) {
            return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured in .env' }, { status: 400 })
        }

        const payload = {
            campaignId: id,
            platform: 'MANUAL TEST',
            severity: 'CRITICAL',
            recommendedAction: 'PAUSE',
            confidence: 100,
            estimatedWastedSpend: 999,
            campaignUrl: `/dashboard/campaign/${id}`,
            isManualTest: true,
            timestamp: new Date().toISOString(),
            alertType: 'urgent',
        }

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET ?? '',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000),
        })

        if (!res.ok) {
            throw new Error(`n8n Webhook returned status ${res.status}`)
        }

        return NextResponse.json({ success: true, message: 'Webhook triggered successfully!' })
    } catch (error) {
        console.error('[Test Webhook] Error:', error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
