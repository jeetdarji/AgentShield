"use client"

import { useEffect, useRef, useState } from "react"
import { architectureFlow, layerTable, pipelineSteps, techStack, roadmap } from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Play, ArrowRight, ChevronRight } from "lucide-react"

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const play = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPlaying(true)
    setActiveStep(0)
    pipelineSteps.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setActiveStep(i)
          if (i === pipelineSteps.length - 1) setTimeout(() => setPlaying(false), 600)
        }, 650 * i),
      )
    })
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Pipeline & architecture"
        title="How It Works"
        description="From code or manifest upload to a deterministic deploy decision — the full authorization regression pipeline."
      />

      {/* Architecture flow */}
      <section>
        <h2 className="mb-4 font-display text-2xl">System architecture</h2>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-5">
          {architectureFlow.map((node, i) => (
            <div key={node} className="flex items-center gap-2">
              <div
                className={cn(
                  "rounded-lg border px-3 py-2 text-center font-mono text-[11px]",
                  node === "DECISION + EVIDENCE"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-muted/50",
                )}
              >
                {node}
              </div>
              {i < architectureFlow.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </section>

      {/* Layer table */}
      <section>
        <h2 className="mb-4 font-display text-2xl">Layer stack</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Layer</th>
                <th className="px-3 py-2.5 font-medium">Technology</th>
              </tr>
            </thead>
            <tbody>
              {layerTable.map((l) => (
                <tr key={l.layer} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5 font-medium">{l.layer}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{l.tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 12-step animated stepper */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Upload → decision · 12 steps</h2>
          <Button onClick={play} disabled={playing} className="gap-2 rounded-full">
            <Play className="h-4 w-4" /> {playing ? "Playing…" : "Play"}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pipelineSteps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-all duration-300",
                i === activeStep
                  ? "scale-[1.02] border-foreground bg-foreground text-background shadow-md"
                  : i < activeStep
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                  i === activeStep ? "bg-background text-foreground" : i < activeStep ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="text-sm font-medium">{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section>
        <h2 className="mb-4 font-display text-2xl">Tech stack</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((t) => (
            <span key={t} className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px]">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <h2 className="mb-4 font-display text-2xl">Implementation roadmap</h2>
        <ol className="relative border-l border-border pl-6">
          {roadmap.map((r) => (
            <li key={r.phase} className="mb-5 last:mb-0">
              <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-foreground font-mono text-[9px] text-background">
                {r.phase}
              </span>
              <p className="text-sm font-medium">Phase {r.phase}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{r.title}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-foreground/20 bg-foreground/[0.03] p-4 font-display text-lg">
          <ArrowRight className="h-4 w-4" />
          Benchmark first. Capability model second. Regression selector third. Dashboard last.
        </div>
      </section>
    </div>
  )
}
