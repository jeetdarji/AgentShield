import { cn } from "@/lib/utils"
import { ShieldAlert, ShieldCheck, ShieldQuestion, Loader2 } from "lucide-react"
import type { FinalDecision } from "@/lib/pipeline/types"

const tone: Record<FinalDecision, { box: string; text: string; Icon: typeof ShieldAlert; title: string }> = {
  BLOCK: { box: "border-red-300 bg-red-50", text: "text-red-700", Icon: ShieldAlert, title: "Deployment blocked" },
  REVALIDATE: { box: "border-amber-300 bg-amber-50", text: "text-amber-800", Icon: ShieldQuestion, title: "Revalidation required" },
  PASS: { box: "border-emerald-300 bg-emerald-50", text: "text-emerald-700", Icon: ShieldCheck, title: "Cleared for deployment" },
}

export function GateCard({
  decision,
  running,
  runId,
}: {
  decision: { final_decision: FinalDecision; decision_reasons: string[] } | null
  running: boolean
  runId: string | null
}) {
  if (!decision) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
        {running && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {running ? "Decision Orchestrator is waiting for all agents to report…" : "The gate decision will appear here."}
      </div>
    )
  }
  const t = tone[decision.final_decision]
  return (
    <section aria-label="Deployment gate decision" className={cn("rounded-lg border p-5", t.box)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <t.Icon className={cn("h-6 w-6", t.text)} aria-hidden />
          <div>
            <p className={cn("font-display text-2xl leading-tight", t.text)}>{decision.final_decision}</p>
            <p className={cn("text-sm", t.text)}>{t.title}</p>
          </div>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          Decision Orchestrator · deterministic · {runId}
        </span>
      </div>
      <ul className={cn("mt-4 flex flex-col gap-1.5 text-sm leading-relaxed", t.text)}>
        {decision.decision_reasons.map((r) => (
          <li key={r} className="flex gap-2">
            <span aria-hidden>{"—"}</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
