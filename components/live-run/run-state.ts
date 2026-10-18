import type {
  CapabilityDiffEntry,
  CoverageResult,
  FinalDecision,
  KnownTestResult,
  RunEvent,
  UnknownTestResult,
} from "@/lib/pipeline/types"

export type NodeStatus = "idle" | "running" | "done" | "error" | "skipped"

export const SEED_RULE_IDS = new Set(["RULE-REFUND-CEILING", "RULE-DELETE-FORBIDDEN"])

export interface LiveUnknown extends UnknownTestResult {
  activeStage: "generator" | "target" | "judge" | null
}

export interface DerivedRun {
  runId: string | null
  rulesInEffect: string[]
  diff: CapabilityDiffEntry[] | null
  coverage: CoverageResult[] | null
  known: KnownTestResult[]
  unknown: LiveUnknown[]
  decision: { final_decision: FinalDecision; decision_reasons: string[] } | null
  runError: string | null
  nodes: NodeStatus[]
  startedAt: string | null
  finishedAt: string | null
}

export function deriveRun(events: RunEvent[]): DerivedRun {
  const state: DerivedRun = {
    runId: null,
    rulesInEffect: [],
    diff: null,
    coverage: null,
    known: [],
    unknown: [],
    decision: null,
    runError: null,
    nodes: ["idle", "idle", "idle", "idle", "idle"],
    startedAt: null,
    finishedAt: null,
  }
  const unknownByCap = new Map<string, LiveUnknown>()
  const ensure = (cap: string) => {
    let u = unknownByCap.get(cap)
    if (!u) {
      u = { capability_id: cap, tool_name: cap, status: "running", activeStage: null }
      unknownByCap.set(cap, u)
    }
    return u
  }
  let sawPostCoverage = false

  for (const e of events) {
    switch (e.step) {
      case "run_started":
        state.runId = e.data.run_id
        state.rulesInEffect = e.data.rules_in_effect
        state.startedAt = e.at
        break
      case "capability_diff":
        state.diff = e.data
        break
      case "coverage":
        state.coverage = e.data
        e.data.filter((c) => c.status === "UNKNOWN").forEach((c) => ensure(c.capability_id))
        break
      case "known_test":
        state.known.push(e.data)
        break
      case "unknown_llm_call_start":
        sawPostCoverage = true
        ensure(e.capability_id).activeStage = e.data.stage
        break
      case "unknown_test_case_generated": {
        const u = ensure(e.capability_id)
        u.test_case = e.data.test_case
        u.test_case_meta = e.data.meta
        u.activeStage = null
        break
      }
      case "target_agent_decision": {
        const u = ensure(e.capability_id)
        u.decision = e.data.decision
        u.decision_meta = e.data.meta
        u.activeStage = null
        break
      }
      case "judge_verdict": {
        const u = ensure(e.capability_id)
        u.verdict = e.data.verdict
        u.verdict_meta = e.data.meta
        u.status = "complete"
        u.activeStage = null
        break
      }
      case "llm_error": {
        const u = ensure(e.capability_id)
        u.status = "error"
        u.error = e.data
        u.activeStage = null
        break
      }
      case "decision":
        sawPostCoverage = true
        state.decision = e.data
        state.finishedAt = e.at
        break
      case "run_error":
        state.runError = e.data.message
        state.finishedAt = e.at
        break
    }
  }
  state.unknown = [...unknownByCap.values()]

  const started = state.runId !== null
  const n = state.nodes
  n[0] = state.diff ? "done" : started ? "running" : "idle"
  n[1] = state.coverage ? "done" : state.diff ? "running" : "idle"

  if (state.coverage) {
    const hasKnown = state.coverage.some((c) => c.status === "KNOWN")
    n[2] = !hasKnown ? "skipped" : sawPostCoverage || state.known.length ? "done" : "running"

    const unk = state.unknown
    if (!unk.length) {
      n[3] = "skipped"
      n[4] = "skipped"
    } else {
      const genFailed = unk.some((u) => u.error?.stage === "generator")
      const genDone = unk.every((u) => u.test_case || u.status === "error")
      n[3] = genDone ? (genFailed ? "error" : "done") : "running"

      const anyTargetStarted = unk.some((u) => u.test_case)
      const laterFailed = unk.some((u) => u.error && u.error.stage !== "generator")
      const allSettled = unk.every((u) => u.status !== "running")
      if (!anyTargetStarted) n[4] = genDone ? "error" : "idle"
      else n[4] = allSettled ? (laterFailed ? "error" : "done") : "running"
    }
  }
  return state
}
