import "server-only"
import { and, asc, desc, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { runEvents, runs } from "@/lib/db/schema"
import type { FinalDecision, RunEvent, RunEventInput, RunResult } from "./types"

type Listener = (event: RunEvent) => void

/**
 * Postgres is the source of truth. The in-memory map only holds runs that are
 * executing on this server instance so SSE subscribers get events instantly;
 * other instances fall back to polling `run_events`.
 */
interface Live {
  runs: Map<string, RunResult>
  listeners: Map<string, Set<Listener>>
  writes: Map<string, Promise<unknown>>
}

const g = globalThis as unknown as { __agentshieldLive?: Live }

function live(): Live {
  if (!g.__agentshieldLive) g.__agentshieldLive = { runs: new Map(), listeners: new Map(), writes: new Map() }
  return g.__agentshieldLive
}

function enqueueWrite(runId: string, task: () => Promise<unknown>) {
  const previous = live().writes.get(runId) ?? Promise.resolve()
  const next = previous.then(task).catch((err) => console.error(`[agentshield] persist failed for ${runId}:`, err))
  live().writes.set(runId, next)
  return next
}

function snapshot(run: RunResult): RunResult {
  return { ...run, events: [] }
}

export async function createRun(rulesInEffect: string[], trigger = "manual"): Promise<RunResult> {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14)
  const run_id = `RUN-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const run: RunResult = {
    run_id,
    status: "running",
    trigger,
    started_at: now.toISOString(),
    finished_at: null,
    rules_in_effect: rulesInEffect,
    capability_diff: [],
    coverage: [],
    known_test_results: [],
    unknown_test_results: [],
    final_decision: null,
    decision_reasons: [],
    events: [],
  }
  await db.insert(runs).values({ runId: run_id, status: "running", trigger, startedAt: now, result: snapshot(run) })
  live().runs.set(run_id, run)
  return run
}

export function getLiveRun(runId: string): RunResult | undefined {
  return live().runs.get(runId)
}

export async function getEventsSince(runId: string, afterSeq: number): Promise<RunEvent[]> {
  const rows = await db
    .select({ event: runEvents.event })
    .from(runEvents)
    .where(and(eq(runEvents.runId, runId), gt(runEvents.seq, afterSeq)))
    .orderBy(asc(runEvents.seq))
  return rows.map((r) => r.event)
}

export async function getRun(runId: string): Promise<RunResult | null> {
  const current = getLiveRun(runId)
  if (current) return current
  const [row] = await db.select().from(runs).where(eq(runs.runId, runId)).limit(1)
  if (!row) return null
  const events = await getEventsSince(runId, -1)
  return { ...row.result, status: row.status, trigger: row.trigger, events }
}

export interface RunSummary {
  run_id: string
  status: RunResult["status"]
  trigger: string
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  final_decision: FinalDecision | null
  decision_reasons: string[]
  changes: number
  known_total: number
  known_passed: number
  unknown_total: number
  violations: number
  llm_errors: number
}

export async function listRunSummaries(limit = 50): Promise<RunSummary[]> {
  const rows = await db.select().from(runs).orderBy(desc(runs.startedAt)).limit(limit)
  return rows.map((row) => {
    const r = row.result
    const finished = row.finishedAt?.toISOString() ?? null
    return {
      run_id: row.runId,
      status: row.status,
      trigger: row.trigger,
      started_at: row.startedAt.toISOString(),
      finished_at: finished,
      duration_ms: row.finishedAt ? row.finishedAt.getTime() - row.startedAt.getTime() : null,
      final_decision: row.finalDecision ?? null,
      decision_reasons: r.decision_reasons ?? [],
      changes: (r.capability_diff ?? []).filter((d) => d.change_type !== "UNCHANGED").length,
      known_total: (r.known_test_results ?? []).length,
      known_passed: (r.known_test_results ?? []).filter((k) => k.pass).length,
      unknown_total: (r.unknown_test_results ?? []).length,
      violations: (r.unknown_test_results ?? []).filter((u) => u.verdict?.verdict === "VIOLATION").length,
      llm_errors: (r.unknown_test_results ?? []).filter((u) => u.status === "error").length,
    }
  })
}

export function appendEvent(runId: string, input: RunEventInput): RunEvent {
  const run = getLiveRun(runId)
  if (!run) throw new Error(`Run ${runId} is not executing on this instance`)
  const event = { ...input, seq: run.events.length, at: new Date().toISOString() } as RunEvent
  run.events.push(event)
  live().listeners.get(runId)?.forEach((l) => l(event))
  enqueueWrite(runId, () =>
    db.insert(runEvents).values({ runId, seq: event.seq, at: new Date(event.at), step: event.step, event }),
  )
  return event
}

export function saveRun(run: RunResult) {
  return enqueueWrite(run.run_id, () =>
    db
      .update(runs)
      .set({
        status: run.status,
        finishedAt: run.finished_at ? new Date(run.finished_at) : null,
        finalDecision: run.final_decision,
        result: snapshot(run),
      })
      .where(eq(runs.runId, run.run_id)),
  )
}

/** Wait for every queued DB write, then drop the run from memory shortly after. */
export async function finalizeRun(runId: string) {
  await live().writes.get(runId)
  live().writes.delete(runId)
  setTimeout(() => {
    live().runs.delete(runId)
    live().listeners.delete(runId)
  }, 60_000)
}

export function subscribe(runId: string, listener: Listener): () => void {
  const s = live()
  if (!s.listeners.has(runId)) s.listeners.set(runId, new Set())
  s.listeners.get(runId)!.add(listener)
  return () => s.listeners.get(runId)?.delete(listener)
}
