import { asc, eq, ne } from "drizzle-orm"
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

async function store() {
  const [{ db }, { policyRules }] = await Promise.all([import("@/lib/db"), import("@/lib/db/schema")])
  return { db, policyRules }
}

export async function getRules(): Promise<PolicyRule[]> {
  const { db, policyRules } = await store()
  const rows = await db.select().from(policyRules).orderBy(asc(policyRules.createdAt))
  if (rows.length === 0) {
    const seeds = seedRules()
    await db
      .insert(policyRules)
      .values(seeds.map((rule) => ({ id: rule.id, source: rule.source, rule })))
      .onConflictDoNothing()
    return seeds
  }
  return rows.map((r) => r.rule)
}

export async function addRule(rule: PolicyRule) {
  const { db, policyRules } = await store()
  await db.insert(policyRules).values({ id: rule.id, source: rule.source, rule }).onConflictDoNothing()
}

export async function resetRules() {
  const { db, policyRules } = await store()
  await db.delete(policyRules).where(ne(policyRules.source, "seed"))
  const seeds = await db.select().from(policyRules).where(eq(policyRules.source, "seed"))
  if (seeds.length < 2) {
    await db
      .insert(policyRules)
      .values(seedRules().map((rule) => ({ id: rule.id, source: rule.source, rule })))
      .onConflictDoNothing()
  }
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
