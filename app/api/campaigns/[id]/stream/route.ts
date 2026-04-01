import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/event-bus'

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

      // Real-time Event Bus Listener
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleNewLog = (log: any) => {
        send({
          type: 'log',
          step: log.step,
          payload: typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload),
          timestamp: log.timestamp,
        })
      }

      const eventName = `workflow-${id}`
      eventBus.on(eventName, handleNewLog)

      let closed = false

      // Catch up on initial state
      prisma.workflowLog.findMany({
        where: { campaignId: id },
        orderBy: { createdAt: 'asc' },
      }).then(logs => {
        if (closed) return
        for (const log of logs) {
          send({
            type: 'log',
            step: log.step,
            payload: log.payload,
            timestamp: log.createdAt,
          })
        }
      }).catch(console.error)

      // Polling only for primary campaign finish/completion status (much lighter)
      const interval = setInterval(async () => {
        if (closed) return

        try {
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
            eventBus.off(eventName, handleNewLog)
            try { controller.close() } catch { /* already closed */ }
          }
        } catch (err) {
          console.error('[SSE Stream] Status poll error:', err)
        }
      }, 2500)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        eventBus.off(eventName, handleNewLog)
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
