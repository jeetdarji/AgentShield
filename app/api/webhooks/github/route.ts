import { createHmac, timingSafeEqual } from "node:crypto"
import { after, NextResponse } from "next/server"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { cicdDeliveries } from "@/lib/db/schema"
import { executePipeline, startRun } from "@/lib/pipeline/runner"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const TRIGGERING_EVENTS = new Set(["push", "pull_request", "manual"])

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return true
  if (!signature?.startsWith("sha256=")) return false
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`)
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

function pick(payload: Record<string, unknown>, event: string) {
  const pr = payload.pull_request as { head?: { ref?: string; sha?: string } } | undefined
  if (event === "pull_request" && pr?.head) return { ref: pr.head.ref ?? null, sha: pr.head.sha ?? null }
  return {
    ref: typeof payload.ref === "string" ? payload.ref : null,
    sha: typeof payload.after === "string" ? payload.after : null,
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  if (!verifySignature(body, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = body ? (JSON.parse(body) as Record<string, unknown>) : {}
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 })
  }

  const event = req.headers.get("x-github-event") ?? "manual"
  const deliveryId = req.headers.get("x-github-delivery") ?? `manual-${crypto.randomUUID()}`
  const { ref, sha } = pick(payload, event)

  let runId: string | null = null
  if (TRIGGERING_EVENTS.has(event)) {
    const run = await startRun(undefined, event === "manual" ? "ci:manual" : `github:${event}`)
    runId = run.run_id
    after(() => executePipeline(run.run_id))
  }

  await db
    .insert(cicdDeliveries)
    .values({ id: deliveryId, provider: "github", event, ref, commitSha: sha, payload, runId })
    .onConflictDoNothing()

  return NextResponse.json({ delivery_id: deliveryId, event, run_id: runId, triggered: runId !== null })
}

export async function GET() {
  const rows = await db.select().from(cicdDeliveries).orderBy(desc(cicdDeliveries.receivedAt)).limit(20)
  return NextResponse.json({
    signature_required: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
    deliveries: rows.map((r) => ({
      id: r.id,
      event: r.event,
      ref: r.ref,
      commit_sha: r.commitSha,
      run_id: r.runId,
      received_at: r.receivedAt.toISOString(),
    })),
  })
}
