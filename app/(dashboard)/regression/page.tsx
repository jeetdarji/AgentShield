"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  allTests,
  testBreakdown,
  testSummary,
  dashboardMetrics,
  adaptiveAttempts,
  skippedGroups,
  resultBanner,
  type TestCase,
} from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { MetricCard } from "@/components/agentshield/metric-card"
import { TestTable } from "@/components/agentshield/test-table"
import { PathFlow } from "@/components/agentshield/path-flow"
import { AiBadge } from "@/components/agentshield/badges"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { Play, RotateCcw, ChevronDown, AlertTriangle, Swords } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip } from "recharts"

const categoryOrder = ["Normal", "Boundary", "Misuse", "Path", "Adaptive"] as const

export default function RegressionPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"targeted" | "full">("targeted")
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [streamed, setStreamed] = useState<TestCase[]>([])
  const [finished, setFinished] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => () => clearTimers(), [])

  const testCount = mode === "targeted" ? testBreakdown.total : testSummary.full
  const timeLabel = mode === "targeted" ? dashboardMetrics.revalidationTime : dashboardMetrics.fullRevalidationTime

  const startRun = () => {
    clearTimers()
    setRunning(true)
    setFinished(false)
    setStreamed([])
    setProgress(0)

    const ordered = [...allTests].sort(
      (a, b) => categoryOrder.indexOf(a.category as any) - categoryOrder.indexOf(b.category as any),
    )
    const total = ordered.length
    const perTest = 90

    ordered.forEach((t, i) => {
      timers.current.push(
        setTimeout(() => {
          setStreamed((prev) => [...prev, t])
          setProgress(Math.round(((i + 1) / total) * 100))
          if (i === total - 1) {
            timers.current.push(
              setTimeout(() => {
                setRunning(false)
                setFinished(true)
                toast.error("Regression detected — deployment blocked", {
                  description: "2 critical failures on the refund human-approval boundary.",
                })
              }, 400),
            )
          }
        }, perTest * i),
      )
    })
  }

  const reset = () => {
    clearTimers()
    setRunning(false)
    setFinished(false)
    setStreamed([])
    setProgress(0)
  }

  const streamedFail = streamed.filter((t) => t.result === "FAIL").length

  return (
    <div>
      <PageHeader
        eyebrow="RUN-2025-0923-01 · v2.4 → v2.5"
        title="Regression Run"
        description="Targeted authorization revalidation. Only the tests touched by the capability diff are executed — the rest are provably unaffected."
        actions={
          finished || running ? (
            <Button variant="outline" className="gap-2 rounded-full" onClick={reset} disabled={running}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          ) : (
            <Button className="gap-2 rounded-full" onClick={startRun}>
              <Play className="h-4 w-4" /> Start run
            </Button>
          )
        }
      />

      {/* Mode toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex rounded-full border border-border p-1">
          {(["targeted", "full"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={running}
              className={cn(
                "rounded-full px-4 py-1.5 font-mono text-[11px] transition-colors disabled:opacity-50",
                mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "targeted" ? "Targeted (AgentShield)" : "Full re-audit (baseline B1)"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Tests selected</p>
            <p className="font-display text-2xl leading-none tabular-nums transition-all">{testCount}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Est. revalidation time</p>
            <p className="font-display text-2xl leading-none tabular-nums">{timeLabel}</p>
          </div>
          {mode === "targeted" && (
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Test reduction</p>
              <p className="font-display text-2xl leading-none text-emerald-600">{testSummary.reductionPct}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress / live */}
      {(running || finished) && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-mono text-xs text-muted-foreground">
              {running ? "Executing targeted suite…" : "Run complete"} · {streamed.length}/{allTests.length} tests
            </span>
            <span className={cn("font-mono text-xs", streamedFail > 0 ? "text-red-600" : "text-muted-foreground")}>
              {streamed.length - streamedFail} passed · {streamedFail} failed
            </span>
          </div>
          <Progress value={running || finished ? progress : 0} className="h-2" />
        </div>
      )}

      {/* Result banner */}
      {finished && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-display text-base text-red-700">Authorization regression detected</p>
            <p className="mt-1 text-sm leading-relaxed text-red-700/90">{resultBanner}</p>
            <Button size="sm" className="mt-3 rounded-full" onClick={() => router.push("/gate")}>
              Go to deployment gate
            </Button>
          </div>
        </div>
      )}

      {/* Metrics */}
      {finished && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="Changed caps" value="4+1" delta="added / expanded" />
          <MetricCard label="Affected policies" value={dashboardMetrics.affectedPolicies} />
          <MetricCard label="Affected paths" value="6/42" />
          <MetricCard label="Tests executed" value="38" delta="vs 500 full" deltaTone="up" />
          <MetricCard label="Attack success" value={`${dashboardMetrics.asrBefore}%→0%`} delta="after fix" deltaTone="up" />
          <MetricCard label="Legit task success" value={`${dashboardMetrics.legitTaskSuccess}%`} deltaTone="up" />
        </div>
      )}

      {/* Empty state */}
      {!running && !finished && (
        <div className="mb-6 rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-display text-lg">Ready to revalidate v2.5</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {testBreakdown.total} targeted tests selected by impact analysis
            ({testBreakdown.Normal} normal · {testBreakdown.Boundary} boundary · {testBreakdown.Misuse} misuse · {testBreakdown.Path} path · {testBreakdown.Adaptive} adaptive).
            Press <strong>Start run</strong> to stream results.
          </p>
        </div>
      )}

      {/* Test table */}
      {(running || finished) && (
        <div className="mb-6">
          <h2 className="mb-3 font-display text-xl">Test results</h2>
          <TestTable tests={streamed} showFilters={finished} />
          {finished && (
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              Result summary: {testSummary.passed} passed, {testSummary.failed} failed (critical). Click any row to open its trace.
            </p>
          )}
        </div>
      )}

      {/* Attack path visual */}
      {finished && (
        <div className="mb-6 rounded-lg border border-border bg-card p-5">
          <h2 className="mb-1 font-display text-xl">Attack path — prompt injection refund</h2>
          <p className="mb-4 text-sm text-muted-foreground">Figure 4: how untrusted ticket content reaches a high-impact tool under a stale authorization assumption.</p>
          <PathFlow />
        </div>
      )}

      {/* Adaptive attacker */}
      {finished && (
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <Swords className="h-4 w-4" /> Adaptive attacker module
              </h2>
              <AiBadge label="AI-assisted attacker" />
            </div>
            <ol className="space-y-2">
              {adaptiveAttempts.map((a) => (
                <li key={a.attempt} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[11px] text-background">{a.attempt}</span>
                  <span className="flex-1 text-sm">{a.strategy}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-mono text-[10px]",
                      a.outcome === "blocked" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700",
                    )}
                  >
                    {a.outcome}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-4 font-display text-base">Attack success by iteration</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={adaptiveAttempts} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <XAxis dataKey="attempt" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `#${v}`} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} unit="%" domain={[0, 40]} />
                <RTooltip formatter={(v) => [`${v}%`, "success rate"]} labelFormatter={(l) => `Attempt ${l}`} />
                <Line type="monotone" dataKey="successRate" stroke="var(--color-destructive)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground">Enforcement drives adaptive attack success down to 6% across iterations.</p>
          </div>
        </div>
      )}

      {/* Skipped */}
      {finished && (
        <Collapsible className="rounded-lg border border-border bg-card">
          <CollapsibleTrigger className="flex w-full items-center gap-2 p-4 text-left [&[data-state=open]>svg]:rotate-180">
            <ChevronDown className="h-4 w-4 transition-transform" />
            <span className="text-sm font-medium">Why {testSummary.full - testBreakdown.total} tests were skipped</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">proven unaffected by impact analyzer</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border px-4 pb-4 pt-3">
            <ul className="space-y-2">
              {skippedGroups.map((g) => (
                <li key={g.name} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.reason}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{g.count} skipped</span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
