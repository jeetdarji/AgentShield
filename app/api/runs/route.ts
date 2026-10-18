import { NextResponse } from "next/server"
import { llmProvider } from "@/lib/pipeline/llm"
import { listRunSummaries } from "@/lib/pipeline/run-store"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const limit = Math.min(Math.max(Number(new URL(req.url).searchParams.get("limit")) || 50, 1), 200)
  return NextResponse.json({ runs: await listRunSummaries(limit), llm_provider: llmProvider() })
}
