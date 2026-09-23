"use client"

import { cn } from "@/lib/utils"
import {
  STATUS_META,
  DIFF_META,
  CAPABILITY_CLASSES,
  type Status,
  type DiffTag,
  type CapabilityClass,
} from "@/lib/mock-data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Cpu, Sparkles } from "lucide-react"

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span
      role="status"
      aria-label={`Status ${m.label}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium",
        m.bg,
        m.border,
        m.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  )
}

export function DiffBadge({ tag, className }: { tag: DiffTag; className?: string }) {
  const m = DIFF_META[tag]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
        m.bg,
        m.border,
        m.text,
        className,
      )}
    >
      {m.label}
    </span>
  )
}

const capTone: Record<CapabilityClass, string> = {
  READ_DATA: "border-slate-200 bg-slate-50 text-slate-700",
  WRITE_DATA: "border-amber-200 bg-amber-50 text-amber-700",
  DELETE_DATA: "border-red-200 bg-red-50 text-red-700",
  MONEY: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PII: "border-violet-200 bg-violet-50 text-violet-700",
  EXTERNAL_SEND: "border-red-200 bg-red-50 text-red-700",
  NETWORK: "border-blue-200 bg-blue-50 text-blue-700",
  EXECUTION: "border-red-300 bg-red-100 text-red-800",
}

export function CapabilityChip({ cap, className }: { cap: CapabilityClass; className?: string }) {
  const meta = CAPABILITY_CLASSES[cap]
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={cn(
              "inline-flex cursor-help items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium",
              capTone[cap],
              className,
            )}
          >
            {meta.label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{meta.description}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">constraint: {meta.constraintField}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function DeterministicBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] text-emerald-700",
        className,
      )}
    >
      <Cpu className="h-3 w-3" />
      Deterministic decision · OPA/Rego
    </span>
  )
}

export function AiBadge({ label = "AI-assisted", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono text-[10px] text-violet-700",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  )
}
