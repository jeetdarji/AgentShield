import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

export type FlowNode = { label: string; detail: string }

const defaultNodes: FlowNode[] = [
  { label: "UNTRUSTED INPUT", detail: "Customer ticket with hidden instruction" },
  { label: "LLM AGENT", detail: "Reads ticket, plans action" },
  { label: "HIGH-IMPACT TOOL", detail: "refund $450 / coupon / email" },
  { label: "STALE ASSUMPTION", detail: "Old ceiling $100, human approval" },
  { label: "SIDE EFFECT", detail: "Policy bypass, financial loss" },
]

export function PathFlow({ nodes = defaultNodes, className }: { nodes?: FlowNode[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 lg:flex-row lg:items-stretch", className)}>
      {nodes.map((node, i) => (
        <div key={node.label} className="flex flex-1 items-center gap-2 lg:flex-col">
          <div className="flex-1 rounded-lg border border-red-200 bg-red-50/60 p-3 lg:w-full">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-red-700">{node.label}</p>
            <p className="mt-1 text-xs leading-snug text-foreground/70">{node.detail}</p>
          </div>
          {i < nodes.length - 1 && (
            <ChevronRight className="h-5 w-5 shrink-0 rotate-90 text-red-400 lg:rotate-0" aria-hidden />
          )}
        </div>
      ))}
    </div>
  )
}
