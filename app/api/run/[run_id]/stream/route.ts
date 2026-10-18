import { getRun, subscribe } from "@/lib/pipeline/run-store"
import type { RunEvent } from "@/lib/pipeline/types"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const TERMINAL_STEPS = new Set<RunEvent["step"]>(["decision", "run_error"])

export async function GET(req: Request, { params }: { params: Promise<{ run_id: string }> }) {
  const { run_id } = await params
  const run = getRun(run_id)
  if (!run) return new Response("Run not found", { status: 404 })

  const encoder = new TextEncoder()
  let cleanup = () => {}

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const send = (event: RunEvent) => {
        if (closed) return
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        if (TERMINAL_STEPS.has(event.step)) close()
      }
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(`: keep-alive\n\n`))
      }, 15_000)
      const close = () => {
        if (closed) return
        closed = true
        clearInterval(heartbeat)
        unsubscribe()
        controller.close()
      }

      const unsubscribe = subscribe(run_id, send)
      cleanup = close
      const backlog = [...run.events]
      for (const e of backlog) send(e)
      req.signal.addEventListener("abort", close)
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
