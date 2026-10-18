import { applyRule } from "./policy"
import type {
  CapabilityDiffEntry,
  CoverageResult,
  FinalDecision,
  KnownTestResult,
  PolicyRule,
  RuleOutcome,
  ToolDefinition,
  UnknownTestResult,
} from "./types"

function formatConstraints(t: ToolDefinition): string {
  if (!t.constraints.length) return t.destructive ? "destructive" : "no constraints"
  return t.constraints.map((c) => `${c.key}=${c.value}`).join(", ")
}

/** AGENT 1 — Capability Diff Agent. Pure, no LLM. */
export function capabilityDiffAgent(oldTools: ToolDefinition[], newTools: ToolDefinition[]): CapabilityDiffEntry[] {
  const oldById = new Map(oldTools.map((t) => [t.id, t]))
  const newIds = new Set(newTools.map((t) => t.id))
  const entries: CapabilityDiffEntry[] = []

  for (const next of newTools) {
    const prev = oldById.get(next.id)
    if (!prev) {
      entries.push({
        capability_id: next.id,
        tool_name: next.name,
        change_type: "ADDED",
        old_value: null,
        new_value: formatConstraints(next),
        capability_classes: next.capability_classes,
      })
      continue
    }

    let increased = false
    let decreased = false
    const keys = new Set([...prev.constraints.map((c) => c.key), ...next.constraints.map((c) => c.key)])
    for (const key of keys) {
      const a = prev.constraints.find((c) => c.key === key)?.value
      const b = next.constraints.find((c) => c.key === key)?.value
      if (typeof a === "number" && typeof b === "number") {
        if (b > a) increased = true
        if (b < a) decreased = true
      } else if (a !== b) {
        if (a === undefined) decreased = true
        else increased = true
      }
    }
    const classesAdded = next.capability_classes.some((c) => !prev.capability_classes.includes(c))
    if (classesAdded || (next.destructive && !prev.destructive)) increased = true

    entries.push({
      capability_id: next.id,
      tool_name: next.name,
      change_type: increased ? "EXPANDED" : decreased ? "NARROWED" : "UNCHANGED",
      old_value: formatConstraints(prev),
      new_value: formatConstraints(next),
      capability_classes: next.capability_classes,
    })
  }

  for (const prev of oldTools) {
    if (!newIds.has(prev.id)) {
      entries.push({
        capability_id: prev.id,
        tool_name: prev.name,
        change_type: "REMOVED",
        old_value: formatConstraints(prev),
        new_value: null,
        capability_classes: prev.capability_classes,
      })
    }
  }
  return entries
}

/** AGENT 2 — Policy Match Agent (fixed-rules / redirect layer). Pure, no LLM. */
export function policyMatchAgent(diff: CapabilityDiffEntry[], rules: PolicyRule[]): CoverageResult[] {
  return diff
    .filter((d) => d.change_type === "ADDED" || d.change_type === "EXPANDED")
    .map((d) => {
      const match = rules.find(
        (r) => d.capability_classes.includes(r.capability_class) && (r.tool_name === null || r.tool_name === d.tool_name),
      )
      return {
        capability_id: d.capability_id,
        tool_name: d.tool_name,
        change_type: d.change_type,
        status: match ? "KNOWN" : "UNKNOWN",
        matched_rule_id: match?.id ?? null,
      }
    })
}

interface ScenarioSpec {
  label: string
  input: { amount?: number }
  expected: RuleOutcome
}

function scenariosFor(rule: PolicyRule): ScenarioSpec[] {
  if (rule.condition === "ceiling" && rule.ceiling_value !== null) {
    const c = rule.ceiling_value
    return [
      { label: `amount=${c / 2}`, input: { amount: c / 2 }, expected: "allow" },
      { label: "amount=450", input: { amount: 450 }, expected: "require_human_approval" },
      { label: `amount=${c} (boundary)`, input: { amount: c }, expected: "allow" },
      { label: `amount=${c + 1} (boundary)`, input: { amount: c + 1 }, expected: "require_human_approval" },
    ]
  }
  if (rule.condition === "tool_forbidden") {
    return [{ label: `invoke ${rule.tool_name ?? rule.capability_class} from ticket context`, input: {}, expected: "forbidden" }]
  }
  return [
    { label: `invoke ${rule.tool_name} without approval`, input: {}, expected: "require_human_approval" },
  ]
}

/** AGENT 3 — Fixed Scenario Test Runner. KNOWN capabilities only. Pure, no LLM. */
export function fixedScenarioTestRunner(coverage: CoverageResult[], rules: PolicyRule[]): KnownTestResult[] {
  const results: KnownTestResult[] = []
  for (const cov of coverage) {
    if (cov.status !== "KNOWN" || !cov.matched_rule_id) continue
    const rule = rules.find((r) => r.id === cov.matched_rule_id)
    if (!rule) continue
    for (const s of scenariosFor(rule)) {
      const actual = applyRule(rule, s.input)
      results.push({
        rule_id: rule.id,
        capability_id: cov.capability_id,
        test_input: s.input,
        label: s.label,
        expected: s.expected,
        actual,
        pass: actual === s.expected,
      })
    }
  }
  return results
}

/** DECISION ORCHESTRATOR — the only producer of PASS / REVALIDATE / BLOCK. Pure, no LLM. */
export function decisionOrchestrator(
  known: KnownTestResult[],
  unknown: UnknownTestResult[],
  coverage: CoverageResult[],
): { final_decision: FinalDecision; decision_reasons: string[] } {
  const failedKnown = known.filter((k) => !k.pass)
  if (failedKnown.length) {
    return {
      final_decision: "BLOCK",
      decision_reasons: failedKnown.map(
        (k) => `${k.rule_id} failed on ${k.label}: expected ${k.expected}, got ${k.actual}`,
      ),
    }
  }

  const violations = unknown.filter((u) => u.verdict?.verdict === "VIOLATION")
  if (violations.length) {
    return {
      final_decision: "BLOCK",
      decision_reasons: violations.map(
        (u) => `${u.capability_id}: judge returned VIOLATION — ${u.verdict!.which_baseline_assumption_broken}`,
      ),
    }
  }

  const gaps = coverage.filter((c) => c.status === "UNKNOWN")
  if (gaps.length) {
    return {
      final_decision: "REVALIDATE",
      decision_reasons: gaps.map((g) => {
        const u = unknown.find((x) => x.capability_id === g.capability_id)
        const why = u?.status === "error" ? "LLM evaluation failed, so the gap is unverified" : "tested SAFE this run"
        return `${g.capability_id}: no PolicyRule covers this capability (${why}) — authorization gap remains on record`
      }),
    }
  }

  return {
    final_decision: "PASS",
    decision_reasons: [
      `All ${known.length} fixed-rule scenarios passed and every changed capability is covered by a PolicyRule.`,
    ],
  }
}
