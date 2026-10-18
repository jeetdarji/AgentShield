"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

type Node = { id: string; col: number; y: number; label: string; kind: "tool" | "cap" | "policy" | "path"; changed?: boolean }

const COLS = [70, 290, 520, 760]
const NODE_W = 140
const NODE_H = 34

const nodes: Node[] = [
  { id: "issue_refund", col: 0, y: 40, label: "issue_refund", kind: "tool", changed: true },
  { id: "cancel_order", col: 0, y: 130, label: "cancel_order", kind: "tool", changed: true },
  { id: "create_coupon", col: 0, y: 220, label: "create_coupon", kind: "tool", changed: true },
  { id: "send_email", col: 0, y: 310, label: "send_email", kind: "tool", changed: true },

  { id: "MONEY", col: 1, y: 55, label: "MONEY", kind: "cap", changed: true },
  { id: "WRITE_DATA", col: 1, y: 150, label: "WRITE_DATA", kind: "cap", changed: true },
  { id: "EXTERNAL_SEND", col: 1, y: 245, label: "EXTERNAL_SEND", kind: "cap", changed: true },
  { id: "PII", col: 1, y: 320, label: "PII", kind: "cap", changed: true },

  { id: "P-01", col: 2, y: 25, label: "P-01 Refund ≤ $100", kind: "policy", changed: true },
  { id: "P-02", col: 2, y: 100, label: "P-02 Approval >$100", kind: "policy", changed: true },
  { id: "P-03", col: 2, y: 175, label: "P-03 No ext. email", kind: "policy", changed: true },
  { id: "P-04", col: 2, y: 250, label: "P-04 No delete", kind: "policy" },
  { id: "P-06", col: 2, y: 325, label: "P-06 PII boundary", kind: "policy" },

  { id: "PATH-07", col: 3, y: 40, label: "PATH-07", kind: "path", changed: true },
  { id: "PATH-11", col: 3, y: 115, label: "PATH-11", kind: "path", changed: true },
  { id: "PATH-19", col: 3, y: 190, label: "PATH-19", kind: "path" },
  { id: "PATH-15", col: 3, y: 280, label: "PATH-15", kind: "path", changed: true },
]

const edges: [string, string][] = [
  ["issue_refund", "MONEY"],
  ["issue_refund", "WRITE_DATA"],
  ["cancel_order", "WRITE_DATA"],
  ["create_coupon", "MONEY"],
  ["create_coupon", "WRITE_DATA"],
  ["send_email", "EXTERNAL_SEND"],
  ["send_email", "PII"],
  ["MONEY", "P-01"],
  ["MONEY", "P-02"],
  ["WRITE_DATA", "P-04"],
  ["EXTERNAL_SEND", "P-03"],
  ["PII", "P-06"],
  ["P-01", "PATH-11"],
  ["P-02", "PATH-07"],
  ["P-04", "PATH-19"],
  ["P-03", "PATH-15"],
  ["P-06", "PATH-15"],
]

const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]))

export function ImpactGraph({ className }: { className?: string }) {
  const [selected, setSelected] = useState<string | null>(null)

  const reachable = useMemo(() => {
    if (!selected) return null
    const set = new Set<string>([selected])
    let frontier = [selected]
    while (frontier.length) {
      const next: string[] = []
      for (const f of frontier) {
        for (const [a, b] of edges) {
          if (a === f && !set.has(b)) {
            set.add(b)
            next.push(b)
          }
        }
      }
      frontier = next
    }
    return set
  }, [selected])

  const nodeActive = (id: string) => (reachable ? reachable.has(id) : nodeById[id].changed)
  const edgeActive = (a: string, b: string) =>
    reachable ? reachable.has(a) && reachable.has(b) : nodeById[a].changed && nodeById[b].changed

  const toneFor = (n: Node, active: boolean) => {
    if (!active) return "fill-muted stroke-border"
    if (n.kind === "path") return "fill-red-50 stroke-red-300"
    if (n.kind === "policy") return "fill-amber-50 stroke-amber-300"
    if (n.kind === "cap") return "fill-blue-50 stroke-blue-300"
    return "fill-foreground/[0.04] stroke-foreground/40"
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Capability → Policy → Path impact graph</p>
        <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm border border-red-300 bg-red-50" /> path
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm border border-amber-300 bg-amber-50" /> policy
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm border border-blue-300 bg-blue-50" /> capability
          </span>
          {selected && (
            <button onClick={() => setSelected(null)} className="underline hover:text-foreground">
              reset
            </button>
          )}
        </div>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        Click a changed capability or tool to trace the policies and attack paths it affects.
      </p>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 900 370" className="h-auto w-full min-w-[720px]">
          <g className="text-foreground">
            {["Tools", "Capabilities", "Policies", "Attack paths"].map((h, i) => (
              <text
                key={h}
                x={COLS[i] + NODE_W / 2}
                y={14}
                textAnchor="middle"
                className="fill-muted-foreground font-mono text-[10px] uppercase"
              >
                {h}
              </text>
            ))}

            {edges.map(([a, b]) => {
              const na = nodeById[a]
              const nb = nodeById[b]
              const active = edgeActive(a, b)
              return (
                <line
                  key={`${a}-${b}`}
                  x1={COLS[na.col] + NODE_W}
                  y1={na.y + NODE_H / 2}
                  x2={COLS[nb.col]}
                  y2={nb.y + NODE_H / 2}
                  className={active ? "stroke-red-400" : "stroke-border"}
                  strokeWidth={active ? 1.5 : 1}
                  strokeOpacity={active ? 0.9 : 0.4}
                />
              )
            })}

            {nodes.map((n) => {
              const active = nodeActive(n.id)
              const clickable = n.kind === "tool" || n.kind === "cap"
              return (
                <g
                  key={n.id}
                  transform={`translate(${COLS[n.col]}, ${n.y})`}
                  onClick={clickable ? () => setSelected(selected === n.id ? null : n.id) : undefined}
                  className={clickable ? "cursor-pointer" : ""}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={5}
                    strokeWidth={1.25}
                    className={cn(toneFor(n, Boolean(active)), selected === n.id && "stroke-foreground stroke-2")}
                  />
                  <text
                    x={NODE_W / 2}
                    y={NODE_H / 2 + 3.5}
                    textAnchor="middle"
                    className={cn(
                      "font-mono text-[10px]",
                      active ? "fill-foreground" : "fill-muted-foreground",
                    )}
                  >
                    {n.label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}
