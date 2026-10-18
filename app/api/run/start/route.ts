import { after, NextResponse } from "next/server"
import { executePipeline, startRun } from "@/lib/pipeline/runner"

export const maxDuration = 300

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { break_llm_key?: boolean }
  const options = { brokenKey: body.break_llm_key === true }
  const run = await startRun(options)
  after(() => executePipeline(run.run_id, options))
  return NextResponse.json({ run_id: run.run_id, status: run.status })
}
