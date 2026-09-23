"use client"

import { prChecks, cicdSteps, githubYaml, machineResultJson, capabilityDiff } from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { CodePanel } from "@/components/agentshield/code-panel"
import { DiffBadge } from "@/components/agentshield/badges"
import { cn } from "@/lib/utils"
import { GitPullRequest, Check, X, Bot, GitBranch } from "lucide-react"

export default function CicdPage() {
  return (
    <div>
      <PageHeader
        eyebrow="CI/CD integration · GitHub"
        title="Authorization Gate in CI/CD"
        description="Every pull request that changes an agent is a controlled version transition. AgentShield runs as a required check and blocks the merge on a regression."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* PR card */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-emerald-600" />
                <span className="font-mono text-[11px] text-muted-foreground">#482 · shopease-support</span>
              </div>
              <h3 className="mt-1.5 font-display text-lg leading-snug">
                Raise refund ceiling to $500 + add cancel/coupon/email tools (v2.5)
              </h3>
              <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                feature/refund-ceiling-500 → main
              </div>
            </div>

            {/* Checks */}
            <div className="divide-y divide-border">
              {prChecks.map((c) => (
                <div key={c.name} className={cn("flex items-center gap-3 p-3", c.status === "failure" && "bg-red-50/60")}>
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full",
                      c.status === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white",
                    )}
                  >
                    {c.status === "success" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 text-sm">
                    <span className="font-mono text-xs">{c.name}</span>
                    <span className="ml-2 text-muted-foreground">{c.label}</span>
                  </span>
                  {c.status === "failure" && (
                    <button className="font-mono text-[11px] text-red-600 underline">Details</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bot comment */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
                <Bot className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono text-xs">agentshield[bot]</span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] text-red-700">
                BLOCK
              </span>
            </div>
            <div className="p-4">
              <p className="mb-3 text-sm">
                Authorization regression detected on <code className="font-mono text-xs">issue_refund</code>. Capability diff:
              </p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {capabilityDiff.slice(0, 4).map((d, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{d.old}</td>
                        <td className="px-3 py-2 font-mono text-xs">→ {d.new}</td>
                        <td className="px-3 py-2 text-right">
                          <DiffBadge tag={d.tag} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                38 tests run · 2 critical failures · decision = BLOCK · report attached
              </p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <CodePanel code={githubYaml} language="yaml" title=".github/workflows/agentshield.yml" />
          <CodePanel code={JSON.stringify(machineResultJson, null, 2)} title="result.json (machine-readable)" />
        </div>
      </div>

      {/* Flow stepper */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-xl">The 7-step GitHub flow</h2>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cicdSteps.map((s, i) => (
            <li key={i} className="rounded-lg border border-border bg-card p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[11px] text-background">
                {i + 1}
              </span>
              <p className="mt-2 text-sm leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Why CI/CD matters for the research</p>
        <p className="mt-1 text-muted-foreground">
          Every mutation is a controlled version transition, and every selected test is logged and comparable against full
          revalidation — producing the exact data needed to evaluate H1.
        </p>
      </div>
    </div>
  )
}
