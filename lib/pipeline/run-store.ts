import type { RunEvent, RunEventInput, RunResult } from "./types"

type Listener = (event: RunEvent) => void

interface Store {
  runs: Map<string, RunResult>
  listeners: Map<string, Set<Listener>>
}

const g = globalThis as unknown as { __agentshieldRuns?: Store }

function store(): Store {
  if (!g.__agentshieldRuns) g.__agentshieldRuns = { runs: new Map(), listeners: new Map() }
  return g.__agentshieldRuns
}

export function createRun(rulesInEffect: string[]): RunResult {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14)
  const run_id = `RUN-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const run: RunResult = {
    run_id,
    status: "running",
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
  store().runs.set(run_id, run)
  return run
}

export function getRun(runId: string): RunResult | undefined {
  return store().runs.get(runId)
}

export function listRuns(): RunResult[] {
  return [...store().runs.values()]
}

export function appendEvent(runId: string, input: RunEventInput): RunEvent {
  const run = getRun(runId)
  if (!run) throw new Error(`Run ${runId} not found`)
  const event = { ...input, seq: run.events.length, at: new Date().toISOString() } as RunEvent
  run.events.push(event)
  store().listeners.get(runId)?.forEach((l) => l(event))
  return event
}

export function subscribe(runId: string, listener: Listener): () => void {
  const s = store()
  if (!s.listeners.has(runId)) s.listeners.set(runId, new Set())
  s.listeners.get(runId)!.add(listener)
  return () => s.listeners.get(runId)?.delete(listener)
}
