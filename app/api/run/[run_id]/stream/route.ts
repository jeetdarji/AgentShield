import { getEventsSince, getLiveRun, getRun, subscribe } from "@/lib/pipeline/run-store"
import type { RunEvent } from "@/lib/pipeline/types"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const TERMINAL_STEPS = new Set<RunEvent["step"]>(["decision", "run_error"])
const POLL_MS = 1000

export async function GET(req: Request, { params }: { params: Promise<{ run_id: string }> }) {
  const { run_id } = await params
  const run = await getRun(run_id)
  if (!run) return new Response("Run not found", { status: 404 })

  const encoder = new TextEncoder()
  let cleanup = () => {}

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let lastSeq = -1
      const timers: ReturnType<typeof setInterval>[] = []
      let unsubscribe = () => {}

      const close = () => {
        if (closed) return
        closed = true
        timers.forEach(clearInterval)
        unsubscribe()
        controller.close()
      }
      const send = (event: RunEvent) => {
        if (closed || event.seq <= lastSeq) return
        lastSeq = event.seq
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        if (TERMINAL_STEPS.has(event.step)) close()
      }

      timers.push(
        setInterval(() => {
          if (!closed) controller.enqueue(encoder.encode(`: keep-alive\n\n`))
        }, 15_000),
      )
      cleanup = close
      req.signal.addEventListener("abort", close)

      if (getLiveRun(run_id)) {
        unsubscribe = subscribe(run_id, send)
        for (const e of [...run.events]) send(e)
        return
      }

      // Run is finished or executing on another instance: replay from Postgres and poll for new rows.
      for (const e of run.events) send(e)
      if (closed || run.status !== "running") {
        close()
        return
      }
      timers.push(
        setInterval(async () => {
          try {
            for (const e of await getEventsSince(run_id, lastSeq)) send(e)
          } catch {
            close()
          }
        }, POLL_MS),
      )
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
