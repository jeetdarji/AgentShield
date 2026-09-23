import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px w-6 bg-foreground/30" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl leading-tight tracking-tight lg:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
