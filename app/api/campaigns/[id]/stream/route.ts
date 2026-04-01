import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          )
        } catch {
          // Controller may be closed
        }
      }

      let lastLogCount = 0
      let closed = false

      const interval = setInterval(async () => {
        if (closed) return

        try {
          const logs = await prisma.workflowLog.findMany({
            where: { campaignId: id },
            orderBy: { createdAt: 'asc' },
          })

          // Send only new logs since last check
          const newLogs = logs.slice(lastLogCount)
          for (const log of newLogs) {
            send({
              type: 'log',
              step: log.step,
              payload: log.payload,
              timestamp: log.createdAt,
            })
          }
          lastLogCount = logs.length

          // Check if campaign is done
          const campaign = await prisma.campaign.findUnique({
            where: { id },
            select: { status: true },
          })

          if (
            campaign?.status === 'DECISION_READY' ||
            campaign?.status === 'AWAITING_USER_ACTION' ||
            campaign?.status === 'COMPLETED' ||
            campaign?.status === 'FAILED'
          ) {
            send({ type: 'complete', status: campaign.status })
            closed = true
            clearInterval(interval)
            try { controller.close() } catch { /* already closed */ }
          }
        } catch (err) {
          console.error('[SSE Stream] Poll error:', err)
        }
      }, 800)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
    },
  })
}
