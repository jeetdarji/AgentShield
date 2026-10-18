import { cn } from "@/lib/utils"
import { Check, Loader2, X, Minus, Sparkles, Cog } from "lucide-react"
import type { NodeStatus } from "./run-state"

const NODES = [
  { name: "Capability Diff Agent", kind: "pure" },
  { name: "Policy Match Agent", kind: "pure" },
  { name: "Fixed Scenario Test Runner", kind: "pure" },
  { name: "Unknown Vulnerability Agent", kind: "llm" },
  { name: "Target Agent Simulator + Judge", kind: "llm" },
] as const

const statusLabel: Record<NodeStatus, string> = {
  idle: "idle",
  running: "running",
  done: "done",
  error: "failed",
  skipped: "skipped",
}

function StatusIcon({ status }: { status: NodeStatus }) {
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
  if (status === "done") return <Check className="h-3.5 w-3.5" aria-hidden />
  if (status === "error") return <X className="h-3.5 w-3.5" aria-hidden />
  return <Minus className="h-3.5 w-3.5" aria-hidden />
}

export function PipelineNodes({ statuses }: { statuses: NodeStatus[] }) {
  return (
    <ol className="grid gap-2 md:grid-cols-5" aria-label="Pipeline agents">
      {NODES.map((node, i) => {
        const s = statuses[i]
        return (
          <li
            key={node.name}
            className={cn(
              "relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors",
              s === "running" && "border-foreground shadow-sm",
              s === "done" && "border-emerald-300 bg-emerald-50/50",
              s === "error" && "border-red-300 bg-red-50",
              (s === "idle" || s === "skipped") && "border-border",
              s === "skipped" && "opacity-60",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">AGENT {i + 1}</span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px]",
                  node.kind === "llm"
                    ? "border-violet-200 bg-violet-50 text-violet-700"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {node.kind === "llm" ? <Sparkles className="h-3 w-3" aria-hidden /> : <Cog className="h-3 w-3" aria-hidden />}
                {node.kind === "llm" ? "real LLM" : "deterministic"}
              </span>
            </div>
            <p className="text-sm font-medium leading-snug">{node.name}</p>
            <span
              className={cn(
                "flex w-fit items-center gap-1.5 font-mono text-[11px]",
                s === "done" && "text-emerald-700",
                s === "error" && "text-red-700",
                s === "running" && "text-foreground",
                (s === "idle" || s === "skipped") && "text-muted-foreground",
              )}
            >
              <StatusIcon status={s} />
              {statusLabel[s]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
