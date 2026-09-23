"use client"

import Link from "next/link"
import {
  shopeaseTools,
  baselineRows,
  baselineJson,
  versionHistory,
  regressionHistory,
  roleChips,
} from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { StatusBadge, CapabilityChip, DiffBadge, DeterministicBadge } from "@/components/agentshield/badges"
import { CodePanel } from "@/components/agentshield/code-panel"
import { CapabilityDiffTable } from "@/components/agentshield/capability-diff-table"
import { AffectedPanel } from "@/components/agentshield/affected-panel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ShopEaseDetailPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Agent detail · shopease-support"
        title="ShopEase Support Agent"
        description="Handles damaged-order tickets and routine support. Owned by the Customer Experience team."
        actions={
          <>
            <StatusBadge status="BLOCK" />
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/compare">Compare v2.4 → v2.5</Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="mb-6 flex w-max gap-1 bg-muted/60">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tools">Tools & Capabilities</TabsTrigger>
            <TabsTrigger value="baseline">Authorization Baseline</TabsTrigger>
            <TabsTrigger value="history">Version History</TabsTrigger>
            <TabsTrigger value="changed">Changed Capabilities</TabsTrigger>
            <TabsTrigger value="affected">Affected Policies & Paths</TabsTrigger>
            <TabsTrigger value="regression">Regression History</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-display text-lg">Identity & purpose</h3>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ["Purpose", "Handles damaged-order tickets and routine support"],
                  ["Owner team", "Customer Experience"],
                  ["Sub-agents", "None"],
                  ["Data classes touched", "PII · Orders · Payments"],
                  ["Current version", "v2.5 (candidate)"],
                  ["Approved baseline", "v2.4"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-red-300 bg-red-50 p-5">
                <p className="font-mono text-[10px] uppercase text-red-700">Current status</p>
                <p className="mt-1 font-display text-2xl text-red-700">Deployment blocked</p>
                <p className="mt-2 text-sm text-red-700/80">
                  v2.5 expands the refund ceiling and adds 3 uncovered tools. Two attack paths bypass human approval.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="mb-3 font-mono text-[10px] uppercase text-muted-foreground">Who cares about this agent</p>
                <div className="space-y-2">
                  {roleChips.map((r) => (
                    <div key={r.role} className="flex items-center justify-between gap-3 text-sm">
                      <span className="rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[11px]">{r.role}</span>
                      <span className="text-right text-xs text-muted-foreground">{r.focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tools */}
        <TabsContent value="tools">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Tool</th>
                  <th className="px-3 py-2.5 font-medium">Capabilities</th>
                  <th className="px-3 py-2.5 font-medium">Constraints</th>
                  <th className="px-3 py-2.5 font-medium">Side effect</th>
                  <th className="px-3 py-2.5 font-medium">Data</th>
                  <th className="px-3 py-2.5 font-medium">v2.5</th>
                </tr>
              </thead>
              <tbody>
                {shopeaseTools.map((t) => (
                  <tr key={t.id} className={cn("border-b border-border/60 last:border-0", t.changeTag === "ADDED" && "bg-red-50/40", t.changeTag === "EXPANDED" && "bg-amber-50/40")}>
                    <td className="px-3 py-3 font-mono text-xs font-medium">{t.name}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.capabilities.map((c) => (
                          <CapabilityChip key={c} cap={c} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{t.constraints}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{t.sideEffect}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{t.dataClasses.join(", ")}</td>
                    <td className="px-3 py-3">{t.changeTag !== "UNCHANGED" ? <DiffBadge tag={t.changeTag} /> : <span className="font-mono text-[10px] text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Baseline */}
        <TabsContent value="baseline" className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <DeterministicBadge />
            <span className="font-mono text-xs text-muted-foreground">Approved by Security Lead · 2025-08-14</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-medium">Capability</th>
                    <th className="px-3 py-2.5 font-medium">Policy</th>
                    <th className="px-3 py-2.5 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {baselineRows.map((r) => (
                    <tr key={r.capability} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2.5 font-medium">{r.capability}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 font-mono text-[10px]",
                            r.policy === "Allowed" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                            r.policy === "Human approval" && "border-amber-200 bg-amber-50 text-amber-700",
                            r.policy === "Forbidden" && "border-red-200 bg-red-50 text-red-700",
                          )}
                        >
                          {r.policy}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-4">
              <CodePanel code={JSON.stringify(baselineJson, null, 2)} title="authorization-baseline.json" />
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">Effect ceiling — refund</p>
                <div className="relative h-8 overflow-hidden rounded-md bg-muted">
                  <div className="absolute inset-y-0 left-0 flex items-center bg-emerald-500/80 px-2" style={{ width: "20%" }}>
                    <span className="font-mono text-[10px] text-white">$100</span>
                  </div>
                  <div className="absolute inset-y-0 flex items-center bg-red-500/70 px-2" style={{ left: "20%", width: "80%" }}>
                    <span className="font-mono text-[10px] text-white">requested $500 (over ceiling)</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Approved ceiling $100 vs $500 requested in v2.5. The overflow (red) is unauthorized.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Version history */}
        <TabsContent value="history">
          <ol className="relative border-l border-border pl-6">
            {versionHistory.map((v) => (
              <li key={v.version} className="mb-6 last:mb-0">
                <span className={cn("absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-background", v.status === "BLOCK" ? "bg-red-500" : "bg-emerald-500")} />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-lg">{v.version}</span>
                  <StatusBadge status={v.status} />
                  <span className="font-mono text-xs text-muted-foreground">{v.at} · {v.author}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{v.label}</p>
              </li>
            ))}
          </ol>
        </TabsContent>

        {/* Changed capabilities */}
        <TabsContent value="changed" className="space-y-4">
          <p className="text-sm text-muted-foreground">Semantic capability diff between the approved baseline v2.4 and candidate v2.5.</p>
          <CapabilityDiffTable />
        </TabsContent>

        {/* Affected */}
        <TabsContent value="affected">
          <AffectedPanel />
        </TabsContent>

        {/* Regression history */}
        <TabsContent value="regression">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Run ID</th>
                  <th className="px-3 py-2.5 font-medium">Versions</th>
                  <th className="px-3 py-2.5 font-medium">Tests run vs full</th>
                  <th className="px-3 py-2.5 font-medium">Result</th>
                  <th className="px-3 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {regressionHistory.map((r) => (
                  <tr key={r.runId} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2.5 font-mono text-xs">{r.runId}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.versions}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.testsRun}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.result} /></td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
