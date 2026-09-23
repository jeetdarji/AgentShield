"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { remediation, patchedResult, type Status } from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { StatusBadge, DeterministicBadge, AiBadge } from "@/components/agentshield/badges"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ShieldX, ShieldAlert, ShieldCheck, Play, Wrench, ArrowRight, Check } from "lucide-react"

const gateSteps = ["Diff", "Revalidate", "Decision"]

const config: Record<
  Status,
  { icon: typeof ShieldX; ring: string; bg: string; text: string; title: string; sub: string }
> = {
  BLOCK: {
    icon: ShieldX,
    ring: "border-red-300",
    bg: "bg-red-50",
    text: "text-red-700",
    title: "Deployment blocked",
    sub: "An authorization regression was detected in v2.5.",
  },
  REVALIDATE: {
    icon: ShieldAlert,
    ring: "border-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-700",
    title: "Revalidation required",
    sub: "Security-relevant change detected; targeted tests queued.",
  },
  PASS: {
    icon: ShieldCheck,
    ring: "border-emerald-300",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    title: "Cleared for deployment",
    sub: "All 38 targeted tests pass; authorization remains active.",
  },
}

export default function GatePage() {
  const router = useRouter()
  const [state, setState] = useState<Status>("BLOCK")
  const [fixing, setFixing] = useState(false)
  const [fixProgress, setFixProgress] = useState(0)
  const [patched, setPatched] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const fixAndRevalidate = () => {
    setFixing(true)
    setFixProgress(0)
    setState("REVALIDATE")
    let p = 0
    const tick = () => {
      p += 8
      setFixProgress(Math.min(p, 100))
      if (p < 100) {
        timers.current.push(setTimeout(tick, 130))
      } else {
        timers.current.push(
          setTimeout(() => {
            setFixing(false)
            setPatched(true)
            setState("PASS")
            toast.success("v2.5.1 revalidated — 38/38 tests pass, ASR 0%", {
              description: "Deployment gate is now open.",
            })
          }, 300),
        )
      }
    }
    timers.current.push(setTimeout(tick, 300))
  }

  const c = config[state]
  const Icon = c.icon
  const stepIndex = state === "BLOCK" ? 2 : state === "REVALIDATE" ? 1 : 2

  return (
    <div>
      <PageHeader
        eyebrow={`Deployment gate · ${patched ? "v2.5.1" : "v2.5"}`}
        title="Deployment Gate"
        description="The gate is the deterministic PASS / REVALIDATE / BLOCK decision that CI/CD enforces. The model may explain, but the decision is reproducible."
        actions={<DeterministicBadge />}
      />

      {/* Demo state switcher */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[10px] uppercase text-muted-foreground">Demo state</span>
        <div className="flex rounded-full border border-border p-1">
          {(["BLOCK", "REVALIDATE", "PASS"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setState(s)
                setPatched(s === "PASS" ? patched : false)
              }}
              className={cn(
                "rounded-full px-4 py-1.5 font-mono text-[11px] transition-colors",
                state === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {gateSteps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex flex-1 items-center gap-2 rounded-lg border px-3 py-2",
                i <= stepIndex ? "border-foreground/30 bg-foreground/[0.03]" : "border-border",
              )}
            >
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px]", i <= stepIndex ? "bg-foreground text-background" : "border border-border text-muted-foreground")}>
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="text-sm font-medium">{s}</span>
            </div>
            {i < gateSteps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Big state card */}
      <div className={cn("mb-6 rounded-2xl border-2 p-8 transition-all duration-500", c.ring, c.bg)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className={cn("flex h-20 w-20 items-center justify-center rounded-full bg-white/70", c.text)}>
            <Icon className="h-10 w-10" />
          </span>
          <div>
            <div className="mb-2 flex justify-center">
              <StatusBadge status={state} />
            </div>
            <h2 className={cn("font-display text-3xl", c.text)}>{c.title}</h2>
            <p className="mt-1 text-sm text-foreground/70">{c.sub}</p>
          </div>

          {fixing && (
            <div className="w-full max-w-md">
              <p className="mb-2 font-mono text-xs text-amber-700">Loading v2.5.1 · re-running 38 targeted tests…</p>
              <Progress value={fixProgress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* State-specific content */}
      {state === "BLOCK" && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 font-display text-lg">Why deployment is blocked</h3>
              <ol className="space-y-2 text-sm">
                {[
                  "The refund effect ceiling expanded from $100 to $500 beyond the approved baseline.",
                  "Two attack paths (PATH-07, PATH-11) bypass the required human-approval boundary.",
                  "Two new capabilities (cancel_order, create_coupon) have no covering policy.",
                ].map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-red-600">{i + 1}.</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.push("/regression")}>
                  View failing tests
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.push("/compare")}>
                  Affected policies
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.push("/evidence")}>
                  View evidence
                </Button>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg">Remediation</h3>
              <AiBadge label="AI-assisted suggestion" />
            </div>
            <ul className="space-y-2 text-sm">
              {remediation.map((r, i) => (
                <li key={i} className="flex gap-2 rounded-md border border-border p-2.5">
                  <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full gap-2 rounded-full" onClick={fixAndRevalidate} disabled={fixing}>
              <Play className="h-4 w-4" /> Fix and revalidate
            </Button>
          </div>
        </div>
      )}

      {state === "REVALIDATE" && !fixing && (
        <div className="rounded-lg border border-amber-200 bg-card p-5">
          <p className="text-sm">Security-relevant change detected; <strong>38 targeted tests</strong> queued.</p>
          <Button className="mt-4 gap-2 rounded-full" onClick={() => router.push("/regression")}>
            <Play className="h-4 w-4" /> Run now
          </Button>
        </div>
      )}

      {state === "PASS" && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-emerald-200 bg-card p-5">
            <h3 className="mb-3 font-display text-lg">Authorization remains active</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border border-border p-3 text-center">
                <p className="font-display text-2xl text-emerald-600">38/38</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">tests pass</p>
              </div>
              <div className="rounded-md border border-border p-3 text-center">
                <p className="font-display text-2xl text-emerald-600">0%</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">attack success</p>
              </div>
              <div className="rounded-md border border-border p-3 text-center">
                <p className="font-display text-2xl">95%</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">legit success</p>
              </div>
            </div>
            <Button className="mt-4 w-full rounded-full">Approve deployment</Button>
          </div>
          {patched && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 font-display text-lg">Patch {patchedResult.version}</h3>
              <ul className="space-y-2 text-sm">
                {patchedResult.changes.map((ch, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="text-xs leading-relaxed">{ch}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
