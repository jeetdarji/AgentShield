import { policies, attackPaths, impactAnalysis } from "@/lib/mock-data"
import { ImpactGraph } from "./impact-graph"
import { cn } from "@/lib/utils"
import { AlertTriangle, GitBranch } from "lucide-react"

const severityTone = {
  critical: "border-red-200 bg-red-50 text-red-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
}

export function AffectedPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">Affected policies</p>
          <p className="mt-1 font-display text-2xl">
            {impactAnalysis.affectedPolicies} <span className="text-base text-muted-foreground">of {impactAnalysis.totalPolicies}</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">Affected paths</p>
          <p className="mt-1 font-display text-2xl">
            {impactAnalysis.affectedPaths} <span className="text-base text-muted-foreground">of {impactAnalysis.totalPaths}</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">Unaffected tests skipped</p>
          <p className="mt-1 font-display text-2xl text-emerald-600">{impactAnalysis.skippedTests}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Authorization gap:</strong> 2 new capabilities (<code className="font-mono text-xs">cancel_order</code>,{" "}
          <code className="font-mono text-xs">create_coupon</code>) have <strong>no covering policy</strong>.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium">Policies ({impactAnalysis.affectedPolicies} of {impactAnalysis.totalPolicies} affected)</p>
          <ul className="space-y-2">
            {policies.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-2.5 text-sm",
                  p.affected ? "border-amber-200 bg-amber-50/60" : "border-border",
                )}
              >
                <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                <span className="flex-1">{p.title}</span>
                {p.affected && (
                  <span className="rounded-md border border-amber-200 bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] text-amber-700">
                    AFFECTED
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Attack paths ({attackPaths.length} affected)</p>
          <ul className="space-y-2">
            {attackPaths.map((path) => (
              <li key={path.id} className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-xs font-medium">{path.id}</span>
                  <span className={cn("ml-auto rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase", severityTone[path.severity])}>
                    {path.severity}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">{path.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ImpactGraph />
    </div>
  )
}
