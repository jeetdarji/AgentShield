"use client"

import { useState } from "react"
import Link from "next/link"
import { agents, agentsKpi, type Status } from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { MetricCard } from "@/components/agentshield/metric-card"
import { StatusBadge } from "@/components/agentshield/badges"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, ArrowRight, ShieldAlert, Activity, Clock } from "lucide-react"

const filters: (Status | "All")[] = ["All", "PASS", "REVALIDATE", "BLOCK"]

export default function AgentsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All")
  const visible = agents.filter((a) => filter === "All" || a.status === filter)

  return (
    <div>
      <PageHeader
        eyebrow="Organization · ShopEase Inc."
        title="Agents"
        description="Every tool-using AI agent under authorization governance. AgentShield tracks whether each version still matches the security authorization you approved."
        actions={
          <Button asChild className="gap-2 rounded-full">
            <Link href="/onboard">
              <Plus className="h-4 w-4" /> Onboard new agent
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Agents monitored" value={agentsKpi.monitored} icon={<Activity className="h-4 w-4" />} />
        <MetricCard label="Blocked" value={agentsKpi.blocked} delta="deployment gate closed" deltaTone="down" icon={<ShieldAlert className="h-4 w-4" />} />
        <MetricCard label="Need revalidation" value={agentsKpi.needRevalidation} delta="targeted tests queued" deltaTone="muted" />
        <MetricCard label="Regressions caught" value={agentsKpi.regressionsCaught} delta="this month" deltaTone="up" />
        <MetricCard label="Avg revalidation" value={agentsKpi.avgRevalidationTime} delta="vs ~41 s full audit" deltaTone="up" icon={<Clock className="h-4 w-4" />} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
              filter === f ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((a) => {
          const isBlock = a.status === "BLOCK"
          const changes = a.added === 0 && a.expanded === 0 ? "0 changes" : `${a.added} added / ${a.expanded} expanded`
          return (
            <div
              key={a.id}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md",
                isBlock ? "border-red-300 ring-1 ring-red-200" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg leading-tight tracking-tight">{a.name}</h3>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{a.domain}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div className="mt-4 flex items-center gap-2 font-mono text-xs">
                <span className="rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground">
                  approved {a.approvedVersion}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span
                  className={cn(
                    "rounded-md border px-2 py-1",
                    a.approvedVersion === a.currentVersion
                      ? "border-border bg-muted text-muted-foreground"
                      : "border-foreground/20 bg-foreground/5 text-foreground",
                  )}
                >
                  current {a.currentVersion}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">Changed capabilities</p>
                  <p className={cn("mt-1 font-medium", isBlock && "text-red-600")}>{changes}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">Deployment</p>
                  <p className="mt-1 font-medium">{a.deployment}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">Last validation</p>
                  <p className="mt-1 text-muted-foreground">{a.lastValidation}</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1 rounded-full">
                  <Link href={a.id === "shopease" ? "/agents/shopease" : "/agents/shopease"}>View detail</Link>
                </Button>
                <Button asChild size="sm" className="flex-1 rounded-full">
                  <Link href="/compare">Compare versions</Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
