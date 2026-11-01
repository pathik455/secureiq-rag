import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { runAgentPipeline } from '@/lib/agents/orchestrator'
import { AgentRunOptions } from '@/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userId = session.user.id
  const body: AgentRunOptions = await req.json().catch(() => ({}))

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        for await (const message of runAgentPipeline(body, userId)) {
          const formatted = `data: ${JSON.stringify(message)}\n\n`
          controller.enqueue(encoder.encode(formatted))
        }
      } catch (err: any) {
        console.error('Agent pipeline error:', err)
        const errMsg = `data: ${JSON.stringify({
          event: 'error',
          data: { message: err?.message || 'Pipeline execution failed' },
        })}\n\n`
        controller.enqueue(encoder.encode(errMsg))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
