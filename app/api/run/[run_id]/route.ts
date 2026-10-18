import { NextResponse } from "next/server"
import { getRun } from "@/lib/pipeline/run-store"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ run_id: string }> }) {
  const { run_id } = await params
  const run = await getRun(run_id)
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 })
  return NextResponse.json(run)
}
