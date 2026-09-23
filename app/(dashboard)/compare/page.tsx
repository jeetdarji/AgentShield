"use client"

import { useRouter } from "next/navigation"
import { mutationTypes, toolsUnifiedDiff } from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { CapabilityDiffTable } from "@/components/agentshield/capability-diff-table"
import { AffectedPanel } from "@/components/agentshield/affected-panel"
import { CodePanel } from "@/components/agentshield/code-panel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight, GitCompareArrows, Play } from "lucide-react"

const summary = [
  { label: "Added", value: 4, tone: "text-red-600" },
  { label: "Expanded", value: 1, tone: "text-amber-600" },
  { label: "Removed", value: 0, tone: "text-muted-foreground" },
  { label: "Narrowed", value: 0, tone: "text-muted-foreground" },
]

export default function ComparePage() {
  const router = useRouter()

  return (
    <div>
      <PageHeader
        eyebrow="Version comparison · shopease-support"
        title="Capability Diff"
        description="Compare the approved authorization baseline against a candidate version. A code diff sees a feature; AgentShield sees an authorization event."
        actions={
          <Button className="gap-2 rounded-full" onClick={() => router.push("/regression")}>
            <Play className="h-4 w-4" /> Run targeted revalidation
          </Button>
        }
      />

      {/* Version selectors */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Baseline (approved)</span>
          <span className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-sm text-emerald-700">
            v2.4
          </span>
        </div>
        <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Candidate</span>
          <span className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 font-mono text-sm text-red-700">
            v2.5
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {summary.map((s) => (
            <div key={s.label} className="text-center">
              <p className={cn("font-display text-2xl leading-none", s.tone)}>{s.value}</p>
              <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mutation type chips */}
      <div className="mb-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Mutation types detected</p>
        <div className="flex flex-wrap gap-2">
          {mutationTypes.map((m) => (
            <span
              key={m.label}
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-[11px]",
                m.present ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
              )}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <Tabs defaultValue="semantic" className="w-full">
        <TabsList className="mb-5 bg-muted/60">
          <TabsTrigger value="semantic" className="gap-2">
            <GitCompareArrows className="h-3.5 w-3.5" /> Semantic Diff
          </TabsTrigger>
          <TabsTrigger value="raw">Raw Code Diff</TabsTrigger>
        </TabsList>

        <TabsContent value="semantic" className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Code diff says</p>
              <p className="mt-1 text-sm font-medium">&ldquo;feature added&rdquo;</p>
              <p className="mt-1 text-xs text-muted-foreground">A raw diff treats the change as a routine capability increase.</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-mono text-[10px] uppercase text-red-700">AgentShield says</p>
              <p className="mt-1 text-sm font-medium text-red-700">&ldquo;potential authorization event&rdquo;</p>
              <p className="mt-1 text-xs text-red-700/80">The effect ceiling expanded and new outbound/destructive sinks appeared.</p>
            </div>
          </div>

          <CapabilityDiffTable />
          <AffectedPanel />
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unified diff of <code className="font-mono text-xs">tools.json</code>. This is what a normal code review sees — one changed number and three new tools, with no security interpretation.
          </p>
          <CodePanel code={toolsUnifiedDiff} language="diff" title="tools.json" variant="diff" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
