import { NextResponse } from "next/server"
import { getRules, resetRules } from "@/lib/pipeline/policy"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ rules: getRules() })
}

export async function DELETE() {
  resetRules()
  return NextResponse.json({ rules: getRules() })
}
