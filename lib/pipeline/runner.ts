import "server-only"
import { capabilityDiffAgent, decisionOrchestrator, fixedScenarioTestRunner, policyMatchAgent } from "./agents"
import { generateAdversarialTicket, judgeDecision, LLMCallError, simulateTargetAgent, type LLMOptions } from "./llm"
import { getRules } from "./policy"
import { appendEvent, createRun, getRun } from "./run-store"
import { AGENT_V2_4_TOOLS, AGENT_V2_5_TOOLS } from "./tools"
import type { RunResult, UnknownTestResult } from "./types"

export function startRun(options?: LLMOptions): RunResult {
  const rules = getRules()
  const run = createRun(rules.map((r) => r.id))
  appendEvent(run.run_id, { step: "run_started", data: { run_id: run.run_id, rules_in_effect: run.rules_in_effect } })
  return run
}

async function runUnknownCapability(runId: string, capabilityId: string, index: number, options?: LLMOptions) {
  const run = getRun(runId)!
  const tool = AGENT_V2_5_TOOLS.find((t) => t.id === capabilityId)!
  const entry: UnknownTestResult = { capability_id: capabilityId, tool_name: tool.name, status: "running" }
  run.unknown_test_results.push(entry)

  let stage: "generator" | "target" | "judge" = "generator"
  try {
    appendEvent(runId, { step: "unknown_llm_call_start", capability_id: capabilityId, data: { stage } })
    const testCaseId = `${runId}-TC${index + 1}`
    const gen = await generateAdversarialTicket(tool, testCaseId, options)
    entry.test_case = gen.testCase
    entry.test_case_meta = gen.meta
    appendEvent(runId, {
      step: "unknown_test_case_generated",
      capability_id: capabilityId,
      data: { test_case: gen.testCase, meta: gen.meta },
    })

    stage = "target"
    appendEvent(runId, { step: "unknown_llm_call_start", capability_id: capabilityId, data: { stage } })
    const target = await simulateTargetAgent(gen.testCase, options)
    entry.decision = target.decision
    entry.decision_meta = target.meta
    appendEvent(runId, {
      step: "target_agent_decision",
      capability_id: capabilityId,
      data: { decision: target.decision, meta: target.meta },
    })

    stage = "judge"
    appendEvent(runId, { step: "unknown_llm_call_start", capability_id: capabilityId, data: { stage } })
    const judged = await judgeDecision(tool, gen.testCase, target.decision, options)
    entry.verdict = judged.verdict
    entry.verdict_meta = judged.meta
    entry.status = "complete"
    appendEvent(runId, {
      step: "judge_verdict",
      capability_id: capabilityId,
      data: { verdict: judged.verdict, meta: judged.meta },
    })
  } catch (err) {
    const raw = err instanceof LLMCallError ? err.raw_responses : []
    entry.status = "error"
    entry.error = { stage, message: (err as Error).message, raw_responses: raw }
    appendEvent(runId, {
      step: "llm_error",
      capability_id: capabilityId,
      data: { stage, message: (err as Error).message, raw_responses: raw },
    })
  }
}

export async function executePipeline(runId: string, options?: LLMOptions) {
  const run = getRun(runId)
  if (!run) return
  try {
    const rules = getRules().filter((r) => run.rules_in_effect.includes(r.id))

    const diff = capabilityDiffAgent(AGENT_V2_4_TOOLS, AGENT_V2_5_TOOLS)
    run.capability_diff = diff
    appendEvent(runId, { step: "capability_diff", data: diff })

    const coverage = policyMatchAgent(diff, rules)
    run.coverage = coverage
    appendEvent(runId, { step: "coverage", data: coverage })

    const known = fixedScenarioTestRunner(coverage, rules)
    for (const result of known) {
      run.known_test_results.push(result)
      appendEvent(runId, { step: "known_test", data: result })
    }

    const unknownIds = coverage.filter((c) => c.status === "UNKNOWN").map((c) => c.capability_id)
    await Promise.all(unknownIds.map((id, i) => runUnknownCapability(runId, id, i, options)))

    const decision = decisionOrchestrator(run.known_test_results, run.unknown_test_results, coverage)
    run.final_decision = decision.final_decision
    run.decision_reasons = decision.decision_reasons
    run.status = "complete"
    run.finished_at = new Date().toISOString()
    appendEvent(runId, { step: "decision", data: decision })
  } catch (err) {
    run.status = "error"
    run.finished_at = new Date().toISOString()
    appendEvent(runId, { step: "run_error", data: { message: (err as Error).message } })
  }
}
