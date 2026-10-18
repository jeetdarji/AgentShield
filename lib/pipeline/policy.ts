import type { PolicyRule, RuleOutcome, ToolDefinition } from "./types"

function seedRules(): PolicyRule[] {
  const now = new Date().toISOString()
  return [
    {
      id: "RULE-REFUND-CEILING",
      capability_class: "MONEY",
      tool_name: "issue_refund",
      condition: "ceiling",
      ceiling_value: 100,
      outcome: "allow",
      outcome_above: "require_human_approval",
      reason: "Refunds up to $100 are auto-approved; anything above requires a human.",
      source: "seed",
      created_at: now,
    },
    {
      id: "RULE-DELETE-FORBIDDEN",
      capability_class: "DELETE_DATA",
      tool_name: null,
      condition: "tool_forbidden",
      ceiling_value: null,
      outcome: "forbidden",
      reason: "No agent may delete data.",
      source: "seed",
      created_at: now,
    },
  ]
}

const store = globalThis as unknown as { __agentshieldRules?: PolicyRule[] }

export function getRules(): PolicyRule[] {
  if (!store.__agentshieldRules) store.__agentshieldRules = seedRules()
  return store.__agentshieldRules
}

export function addRule(rule: PolicyRule) {
  getRules().push(rule)
}

export function resetRules() {
  store.__agentshieldRules = seedRules()
}

/** Pure evaluation of a rule against an attempted invocation. */
export function applyRule(rule: PolicyRule, input: { amount?: number }): RuleOutcome {
  switch (rule.condition) {
    case "ceiling":
    case "amount <= ceiling":
    case "amount > ceiling": {
      if (rule.ceiling_value === null || typeof input.amount !== "number") return "require_human_approval"
      return input.amount <= rule.ceiling_value ? rule.outcome : (rule.outcome_above ?? "require_human_approval")
    }
    case "tool_forbidden":
      return "forbidden"
    case "tool_requires_approval":
      return "require_human_approval"
  }
}

export function buildPromotedRule(tool: ToolDefinition, testCaseId: string): PolicyRule {
  const needsApproval = tool.destructive || tool.capability_classes.includes("MONEY")
  const slug = tool.name.toUpperCase().replace(/_/g, "-")
  const primaryClass =
    tool.capability_classes.find((c) => c === "EXTERNAL_SEND" || c === "MONEY") ?? tool.capability_classes[0]
  return {
    id: `RULE-${slug}-${needsApproval ? "APPROVAL" : "FORBIDDEN"}`,
    capability_class: primaryClass,
    tool_name: tool.name,
    condition: needsApproval ? "tool_requires_approval" : "tool_forbidden",
    ceiling_value: null,
    outcome: needsApproval ? "require_human_approval" : "forbidden",
    reason: needsApproval
      ? `${tool.name} now requires human approval — promoted from red-team finding ${testCaseId}.`
      : `${tool.name} is forbidden for ticket-driven actions — promoted from red-team finding ${testCaseId}.`,
    source: "promoted",
    promoted_from_test_case_id: testCaseId,
    created_at: new Date().toISOString(),
  }
}
