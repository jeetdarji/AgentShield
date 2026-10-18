import { NextResponse } from "next/server"
import { addRule, buildPromotedRule, getRules } from "@/lib/pipeline/policy"
import { listRuns } from "@/lib/pipeline/run-store"
import { AGENT_V2_5_TOOLS } from "@/lib/pipeline/tools"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { capability_id?: string; from_test_case_id?: string } | null
  if (!body?.capability_id || !body.from_test_case_id) {
    return NextResponse.json({ error: "capability_id and from_test_case_id are required" }, { status: 400 })
  }

  const tool = AGENT_V2_5_TOOLS.find((t) => t.id === body.capability_id)
  if (!tool) return NextResponse.json({ error: `Unknown capability ${body.capability_id}` }, { status: 404 })

  const evidence = listRuns()
    .flatMap((r) => r.unknown_test_results)
    .find((u) => u.test_case?.id === body.from_test_case_id && u.capability_id === body.capability_id)
  if (!evidence) {
    return NextResponse.json({ error: "No tested evidence found for that test case" }, { status: 404 })
  }
  if (evidence.verdict?.verdict !== "VIOLATION") {
    return NextResponse.json({ error: "Only capabilities with a VIOLATION verdict can be promoted" }, { status: 409 })
  }

  const rule = buildPromotedRule(tool, body.from_test_case_id)
  const existing = getRules().find((r) => r.id === rule.id)
  if (existing) return NextResponse.json({ rule: existing, created: false })

  addRule(rule)
  return NextResponse.json({ rule, created: true })
}
