"use client"

import { useState } from "react"
import { toast } from "sonner"
import { evidence, reviewTrail, decisionLog, type Status } from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { StatusBadge, DeterministicBadge } from "@/components/agentshield/badges"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { FileDown, FileText, Search, CheckCircle2 } from "lucide-react"

export default function EvidencePage() {
  const [query, setQuery] = useState("")
  const [decisionFilter, setDecisionFilter] = useState<Status | "All">("All")

  const rows = decisionLog.filter((d) => {
    const matchQuery =
      query === "" ||
      [d.id, d.agent, d.action, d.reason].some((f) => f.toLowerCase().includes(query.toLowerCase()))
    const matchDecision = decisionFilter === "All" || d.decision === decisionFilter
    return matchQuery && matchDecision
  })

  return (
    <div>
      <PageHeader
        eyebrow="Compliance & risk"
        title="Evidence Pack & Audit Trail"
        description="A reproducible record for every authorization decision — what changed, why it mattered, what was tested, and who reviewed it."
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => toast.success("Evidence pack exported", { description: `${evidence.runId}.json prepared (synthetic)` })}
            >
              <FileDown className="h-4 w-4" /> Export JSON
            </Button>
            <Button
              className="gap-2 rounded-full"
              onClick={() => toast.success("Evidence pack exported", { description: `${evidence.runId}.pdf prepared (synthetic)` })}
            >
              <FileDown className="h-4 w-4" /> Export PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Evidence pack */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg">Evidence pack</h3>
              <p className="font-mono text-xs text-muted-foreground">{evidence.runId}</p>
            </div>
            <StatusBadge status="BLOCK" />
          </div>
          <ul className="space-y-2">
            {evidence.contents.map((c) => (
              <li key={c} className="flex items-center gap-3 rounded-md border border-border p-2.5 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{c}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <DeterministicBadge />
          </div>
        </div>

        {/* Review trail */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-lg">Review trail</h3>
          <ol className="relative border-l border-border pl-6">
            {reviewTrail.map((r, i) => (
              <li key={i} className="mb-5 last:mb-0">
                <span className={cn("absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full", r.actor.includes("automated") ? "bg-foreground" : "bg-blue-500")} />
                <p className="text-sm font-medium">{r.action}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{r.actor} · {r.at}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Decision log */}
      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Decision log — &ldquo;why was this allowed/blocked?&rdquo;</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search decisions…" className="h-9 w-56 rounded-full pl-9" />
            </div>
            <div className="flex gap-1">
              {(["All", "PASS", "REVALIDATE", "BLOCK"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDecisionFilter(f)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                    decisionFilter === f ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Run ID</th>
                <th className="px-3 py-2.5 font-medium">Agent</th>
                <th className="px-3 py-2.5 font-medium">Versions</th>
                <th className="px-3 py-2.5 font-medium">Action</th>
                <th className="px-3 py-2.5 font-medium">Decision</th>
                <th className="px-3 py-2.5 font-medium">Reason</th>
                <th className="px-3 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5 font-mono text-xs">{d.id}</td>
                  <td className="px-3 py-2.5">{d.agent}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{d.versions}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.action}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={d.decision} /></td>
                  <td className="max-w-[240px] px-3 py-2.5 text-xs text-muted-foreground">{d.reason}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{d.at}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">No decisions match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
