"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Play, RotateCcw, Loader2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/agentshield/page-header"
import type { RunEvent } from "@/lib/pipeline/types"
import { deriveRun, type LiveUnknown } from "./run-state"
import { PipelineNodes } from "./pipeline-nodes"
import { CoverageRouting, KnownLane, UnknownLane } from "./lanes"
import { GateCard } from "./gate-card"

export function LiveRunClient() {
  const [events, setEvents] = useState<RunEvent[]>([])
  const [starting, setStarting] = useState(false)
  const [streamOpen, setStreamOpen] = useState(false)
  const [brokenKey, setBrokenKey] = useState(false)
  const [promotedCaps, setPromotedCaps] = useState<Set<string>>(new Set())
  const [promotingCap, setPromotingCap] = useState<string | null>(null)
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => () => sourceRef.current?.close(), [])

  const run = useMemo(() => deriveRun(events), [events])
  const running = starting || streamOpen

  const startRun = async () => {
    sourceRef.current?.close()
    setEvents([])
    setStarting(true)
    try {
      const res = await fetch("/api/run/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ break_llm_key: brokenKey }),
      })
      if (!res.ok) throw new Error(`Start failed (${res.status})`)
      const { run_id } = (await res.json()) as { run_id: string }

      const es = new EventSource(`/api/run/${run_id}/stream`)
      sourceRef.current = es
      setStreamOpen(true)
      es.onmessage = (msg) => {
        const event = JSON.parse(msg.data) as RunEvent
        setEvents((prev) => (prev.some((e) => e.seq === event.seq) ? prev : [...prev, event]))
        if (event.step === "decision" || event.step === "run_error") {
          es.close()
          setStreamOpen(false)
        }
      }
      es.onerror = () => {
        es.close()
        setStreamOpen(false)
      }
    } catch (err) {
      toast.error("Could not start run", { description: (err as Error).message })
    } finally {
      setStarting(false)
    }
  }

  const promote = async (u: LiveUnknown) => {
    if (!u.test_case) return
    setPromotingCap(u.capability_id)
    try {
      const res = await fetch("/api/policy/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capability_id: u.capability_id, from_test_case_id: u.test_case.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Promotion failed")
      setPromotedCaps((prev) => new Set(prev).add(u.capability_id))
      toast.success(`${data.rule.id} now exists`, {
        description: `${u.capability_id} will route through the Fixed Scenario Test Runner on the next run.`,
        action: { label: "Re-run to verify", onClick: () => startRun() },
      })
    } catch (err) {
      toast.error("Promotion failed", { description: (err as Error).message })
    } finally {
      setPromotingCap(null)
    }
  }

  const resetRules = async () => {
    await fetch("/api/policy", { method: "DELETE" })
    setPromotedCaps(new Set())
    toast("Policy rules reset to seed", { description: "Only RULE-REFUND-CEILING and RULE-DELETE-FORBIDDEN remain." })
  }

  const hasPromotions = promotedCaps.size > 0 || run.rulesInEffect.some((r) => r !== "RULE-REFUND-CEILING" && r !== "RULE-DELETE-FORBIDDEN")
  const llmLatencyMs = run.unknown.reduce(
    (sum, u) => Math.max(sum, (u.test_case_meta?.latency_ms ?? 0) + (u.decision_meta?.latency_ms ?? 0) + (u.verdict_meta?.latency_ms ?? 0)),
    0,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={run.runId ? `${run.runId} · ShopEase v2.4 → v2.5` : "ShopEase v2.4 → v2.5 · live pipeline"}
        title="Live Run"
        description="Five agents run in order. Known capabilities go through fixed deterministic rules; unknown ones are redirected to real LLM red-team agents. A deterministic orchestrator makes the final call."
        className="mb-0"
        actions={
          <>
            {hasPromotions && (
              <Button variant="ghost" size="sm" className="gap-2 rounded-full" onClick={resetRules} disabled={running}>
                <Undo2 className="h-4 w-4" aria-hidden /> Reset rules
              </Button>
            )}
            <Button className="gap-2 rounded-full" onClick={startRun} disabled={running}>
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : run.runId ? (
                <RotateCcw className="h-4 w-4" aria-hidden />
              ) : (
                <Play className="h-4 w-4" aria-hidden />
              )}
              {running ? "Running…" : run.runId ? (promotedCaps.size ? "Re-run to verify" : "Run again") : "Start Run"}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <p className="font-mono text-[11px] text-muted-foreground">
          Rules in effect:{" "}
          <span className="text-foreground">{run.rulesInEffect.length ? run.rulesInEffect.join(", ") : "—"}</span>
          {llmLatencyMs > 0 && <span className="ml-3">LLM critical path: {(llmLatencyMs / 1000).toFixed(1)}s</span>}
        </p>
        <div className="flex items-center gap-2">
          <Switch id="broken-key" checked={brokenKey} onCheckedChange={setBrokenKey} disabled={running} />
          <Label htmlFor="broken-key" className="font-mono text-[11px] text-muted-foreground">
            Simulate broken API key
          </Label>
        </div>
      </div>

      <PipelineNodes statuses={run.nodes} />

      {run.runError && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Pipeline error: {run.runError}
        </p>
      )}

      {!run.runId && !running && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-display text-lg">Ready to revalidate ShopEase v2.5</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Press <strong>Start Run</strong>. Every result below is computed server-side or returned by a live model call.
          </p>
        </div>
      )}

      {run.coverage && (
        <section className="flex flex-col gap-3" aria-labelledby="routing">
          <header className="flex items-baseline justify-between">
            <h2 id="routing" className="font-display text-xl">Coverage routing</h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              Agent 1 found {run.diff?.filter((d) => d.change_type !== "UNCHANGED").length ?? 0} changes · Agent 2 matched rules
            </span>
          </header>
          <CoverageRouting coverage={run.coverage} />
        </section>
      )}

      {run.coverage && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <KnownLane results={run.known} />
          <UnknownLane
            unknown={run.unknown}
            promotedCaps={promotedCaps}
            promotingCap={promotingCap}
            onPromote={promote}
            onRetry={startRun}
          />
        </div>
      )}

      {run.runId && <GateCard decision={run.decision} running={running} runId={run.runId} />}
    </div>
  )
}
