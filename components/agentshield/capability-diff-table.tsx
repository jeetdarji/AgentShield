"use client"

import { useState } from "react"
import { capabilityDiff, shopeaseTools } from "@/lib/mock-data"
import { DiffBadge } from "./badges"
import { cn } from "@/lib/utils"
import { ArrowRight, ChevronDown } from "lucide-react"

export function CapabilityDiffTable() {
  const [showUnchanged, setShowUnchanged] = useState(false)
  const unchanged = shopeaseTools.filter((t) => t.changeTag === "UNCHANGED")

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5 font-medium">v2.4 (approved)</th>
            <th className="px-3 py-2.5 font-medium">v2.5 (candidate)</th>
            <th className="px-3 py-2.5 font-medium">Security interpretation</th>
            <th className="px-3 py-2.5 font-medium">Tag</th>
            <th className="px-3 py-2.5 font-medium">Affects</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td colSpan={5} className="bg-muted/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Changed capabilities · 4 added / 1 expanded
            </td>
          </tr>
          {capabilityDiff.map((d, i) => (
            <tr key={i} className={cn("border-b border-border/60", d.tag === "ADDED" ? "bg-red-50/40" : "bg-amber-50/40")}>
              <td className="px-3 py-3 text-muted-foreground">
                <code className="font-mono text-xs">{d.old}</code>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <code className="font-mono text-xs font-medium">{d.new}</code>
                </div>
              </td>
              <td className="px-3 py-3 text-xs">{d.interpretation}</td>
              <td className="px-3 py-3">
                <DiffBadge tag={d.tag} />
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {[...d.affects.policies, ...d.affects.paths].map((ref) => (
                    <span key={ref} className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {ref}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}

          <tr>
            <td colSpan={5} className="bg-muted/30 px-3 py-0">
              <button
                onClick={() => setShowUnchanged((v) => !v)}
                className="flex w-full items-center gap-2 py-2 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform", showUnchanged && "rotate-180")} />
                {unchanged.length} unchanged capabilities (collapsed)
              </button>
            </td>
          </tr>
          {showUnchanged &&
            unchanged.map((t) => (
              <tr key={t.id} className="border-b border-border/60 text-muted-foreground last:border-0">
                <td className="px-3 py-2.5" colSpan={2}>
                  <code className="font-mono text-xs">{t.name}</code>
                </td>
                <td className="px-3 py-2.5 text-xs">{t.changeNote ?? "No change"}</td>
                <td className="px-3 py-2.5">
                  <DiffBadge tag="UNCHANGED" />
                </td>
                <td className="px-3 py-2.5" />
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
