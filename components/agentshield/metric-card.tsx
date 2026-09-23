import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function MetricCard({
  label,
  value,
  delta,
  deltaTone = "muted",
  icon,
  className,
}: {
  label: string
  value: ReactNode
  delta?: string
  deltaTone?: "up" | "down" | "muted"
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl leading-none tracking-tight">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-1.5 font-mono text-[11px]",
            deltaTone === "up" && "text-emerald-600",
            deltaTone === "down" && "text-red-600",
            deltaTone === "muted" && "text-muted-foreground",
          )}
        >
          {delta}
        </p>
      )}
    </div>
  )
}
