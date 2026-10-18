export const CAPABILITY_CLASSES = [
  "READ_DATA",
  "WRITE_DATA",
  "DELETE_DATA",
  "MONEY",
  "PII",
  "EXTERNAL_SEND",
  "NETWORK",
  "EXECUTION",
] as const

export type CapabilityClass = (typeof CAPABILITY_CLASSES)[number]

export interface ToolConstraint {
  key: string
  value: number | string
}

export interface ToolDefinition {
  id: string
  name: string
  description: string
  capability_classes: CapabilityClass[]
  constraints: ToolConstraint[]
  data_classes: string[]
  destructive: boolean
}

export type RuleCondition = "amount <= ceiling" | "amount > ceiling" | "ceiling" | "tool_forbidden" | "tool_requires_approval"
export type RuleOutcome = "allow" | "require_human_approval" | "forbidden"

export interface PolicyRule {
  id: string
  capability_class: CapabilityClass
  /** null = applies to any tool carrying capability_class */
  tool_name: string | null
  condition: RuleCondition
  ceiling_value: number | null
  /** for "ceiling" rules: outcome when amount <= ceiling; above ceiling -> outcome_above */
  outcome: RuleOutcome
  outcome_above?: RuleOutcome
  reason: string
  source: "seed" | "promoted"
  promoted_from_test_case_id?: string
  created_at: string
}

export type ChangeType = "ADDED" | "EXPANDED" | "REMOVED" | "NARROWED" | "UNCHANGED"

export interface CapabilityDiffEntry {
  capability_id: string
  tool_name: string
  change_type: ChangeType
  old_value: string | null
  new_value: string | null
  capability_classes: CapabilityClass[]
}

export interface CoverageResult {
  capability_id: string
  tool_name: string
  change_type: ChangeType
  status: "KNOWN" | "UNKNOWN"
  matched_rule_id: string | null
}

export interface KnownTestResult {
  rule_id: string
  capability_id: string
  test_input: Record<string, unknown>
  label: string
  expected: RuleOutcome
  actual: RuleOutcome
  pass: boolean
}

export interface GeneratedTestCase {
  id: string
  target_capability_id: string
  ticket_text: string
  hidden_instruction_summary: string
  risk_rationale: string
}

export interface TargetAgentDecision {
  test_case_id: string
  tool_called: string | null
  tool_arguments: Record<string, unknown> | null
  agent_reasoning_summary: string
  refused: boolean
}

export interface JudgeVerdict {
  test_case_id: string
  verdict: "VIOLATION" | "SAFE"
  reason: string
  which_baseline_assumption_broken: string
}

export interface LLMCallMeta {
  model: string
  latency_ms: number
  attempts: number
  raw_responses: string[]
}

export interface UnknownTestResult {
  capability_id: string
  tool_name: string
  status: "running" | "complete" | "error"
  error?: { stage: "generator" | "target" | "judge"; message: string; raw_responses: string[] }
  test_case?: GeneratedTestCase
  test_case_meta?: LLMCallMeta
  decision?: TargetAgentDecision
  decision_meta?: LLMCallMeta
  verdict?: JudgeVerdict
  verdict_meta?: LLMCallMeta
}

export type FinalDecision = "PASS" | "REVALIDATE" | "BLOCK"

export type RunEvent =
  | { seq: number; at: string; step: "run_started"; data: { run_id: string; rules_in_effect: string[] } }
  | { seq: number; at: string; step: "capability_diff"; data: CapabilityDiffEntry[] }
  | { seq: number; at: string; step: "coverage"; data: CoverageResult[] }
  | { seq: number; at: string; step: "known_test"; data: KnownTestResult }
  | { seq: number; at: string; step: "unknown_llm_call_start"; capability_id: string; data: { stage: "generator" | "target" | "judge" } }
  | { seq: number; at: string; step: "unknown_test_case_generated"; capability_id: string; data: { test_case: GeneratedTestCase; meta: LLMCallMeta } }
  | { seq: number; at: string; step: "target_agent_decision"; capability_id: string; data: { decision: TargetAgentDecision; meta: LLMCallMeta } }
  | { seq: number; at: string; step: "judge_verdict"; capability_id: string; data: { verdict: JudgeVerdict; meta: LLMCallMeta } }
  | { seq: number; at: string; step: "llm_error"; capability_id: string; data: { stage: "generator" | "target" | "judge"; message: string; raw_responses: string[] } }
  | { seq: number; at: string; step: "decision"; data: { final_decision: FinalDecision; decision_reasons: string[] } }
  | { seq: number; at: string; step: "run_error"; data: { message: string } }

export type RunEventInput = RunEvent extends infer E ? (E extends RunEvent ? Omit<E, "seq" | "at"> : never) : never

export interface RunResult {
  run_id: string
  status: "running" | "complete" | "error"
  started_at: string
  finished_at: string | null
  rules_in_effect: string[]
  capability_diff: CapabilityDiffEntry[]
  coverage: CoverageResult[]
  known_test_results: KnownTestResult[]
  unknown_test_results: UnknownTestResult[]
  final_decision: FinalDecision | null
  decision_reasons: string[]
  events: RunEvent[]
}
