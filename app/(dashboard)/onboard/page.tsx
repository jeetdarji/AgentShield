"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/agentshield/page-header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GitBranch, Package, FileJson, Github, ShieldCheck, Check, Loader2, Rocket } from "lucide-react"

const options = [
  { id: "git", icon: GitBranch, title: "Git repository", desc: "Connect a repo and pick a commit or pull request to analyze." },
  { id: "package", icon: Package, title: "Agent package upload", desc: "Upload a ZIP / container manifest plus sample traces." },
  { id: "manifest", icon: FileJson, title: "Tool manifest / MCP / OpenAPI", desc: "Import tool definitions from MCP or an OpenAPI spec." },
  { id: "cicd", icon: Github, title: "CI/CD gate", desc: "Drop a GitHub Action into your pipeline as a merge gate." },
]

const steps = [
  { title: "Connect", detail: "Authenticate the source and select the agent revision." },
  { title: "Sandbox build", detail: "Docker sandbox with mocked services, network restricted." },
  { title: "Inventory", detail: "Discover agents, tools, arguments, data stores, endpoints." },
  { title: "Extract capabilities", detail: "Classify READ / WRITE / DELETE / PII / MONEY / NETWORK / EXTERNAL_SEND." },
  { title: "Build capability graph", detail: "Link tools → capabilities → policies → paths." },
  { title: "Save authorization baseline", detail: "Persist the approved baseline for future diffs." },
]

const dockerLog = [
  "$ docker compose up --build agentshield-sandbox",
  "[+] Building sandbox image ................. done",
  "[+] Replacing live services with safe mocks .... done",
  "  → orders-api      → mock:orders (synthetic)",
  "  → payments-api    → mock:payments (synthetic)",
  "  → email-gateway   → mock:smtp (sinkhole)",
  "[+] Network policy: egress DENY (allow-list only)",
  "[+] Injecting synthetic credentials ......... done",
  "[+] Sandbox ready — no production credentials used",
]

export default function OnboardPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [active, setActive] = useState(-1)
  const [done, setDone] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => () => clearTimers(), [])

  const runWizard = (fast = false) => {
    clearTimers()
    setDone(false)
    setLogs([])
    setActive(0)
    const stepDelay = fast ? 220 : 900
    steps.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setActive(i)
          if (i === 1) {
            dockerLog.forEach((line, li) => {
              timers.current.push(setTimeout(() => setLogs((prev) => [...prev, line]), (fast ? 40 : 120) * li))
            })
          }
          if (i === steps.length - 1) {
            timers.current.push(setTimeout(() => setDone(true), stepDelay))
          }
        }, stepDelay * i + (i > 1 ? (fast ? 300 : 1000) : 0)),
      )
    })
  }

  const loadDemo = () => {
    setSelected("git")
    runWizard(true)
  }

  return (
    <div>
      <PageHeader
        eyebrow="F1 · Agent & tool onboarding"
        title="Onboard Agent"
        description="Bring an agent under authorization governance. AgentShield inventories its tools, extracts capabilities, and saves an approved baseline to diff against later."
        actions={
          <Button onClick={loadDemo} className="gap-2 rounded-full">
            <Rocket className="h-4 w-4" /> Load ShopEase demo
          </Button>
        }
      />

      <div className="mb-6 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>No production credentials required. Synthetic credentials + mock APIs + Docker sandbox.</span>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((o) => {
          const Icon = o.icon
          const isSel = selected === o.id
          return (
            <div
              key={o.id}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-5 transition-all",
                isSel ? "border-foreground ring-1 ring-foreground/20" : "border-border hover:shadow-md",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground/5">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 font-display text-base">{o.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{o.desc}</p>
              <Button
                variant={isSel ? "default" : "outline"}
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => {
                  setSelected(o.id)
                  runWizard(false)
                }}
              >
                {isSel ? "Selected" : "Select"}
              </Button>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg">Onboarding pipeline</h3>
              {done && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] text-emerald-700">
                  <Check className="h-3 w-3" /> Baseline saved
                </span>
              )}
            </div>
            <ol className="space-y-1">
              {steps.map((s, i) => {
                const state = i < active || done ? "done" : i === active ? "active" : "todo"
                return (
                  <li
                    key={s.title}
                    className={cn(
                      "flex gap-3 rounded-lg border p-3 transition-colors",
                      state === "active" && "border-foreground/30 bg-foreground/[0.03]",
                      state === "done" && "border-emerald-200 bg-emerald-50/50",
                      state === "todo" && "border-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]",
                        state === "done" && "bg-emerald-500 text-white",
                        state === "active" && "bg-foreground text-background",
                        state === "todo" && "border border-border text-muted-foreground",
                      )}
                    >
                      {state === "done" ? <Check className="h-3 w-3" /> : state === "active" ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
                    </span>
                    <div>
                      <p className={cn("text-sm font-medium", state === "todo" && "text-muted-foreground")}>{s.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
                    </div>
                  </li>
                )
              })}
            </ol>

            {done && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="rounded-full" onClick={() => router.push("/agents/shopease")}>
                  View agent detail
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => router.push("/compare")}>
                  Compare versions
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-[oklch(0.16_0.01_60)] p-0">
            <div className="border-b border-white/10 px-4 py-2">
              <span className="font-mono text-[11px] text-white/60">sandbox · docker log</span>
            </div>
            <div className="h-[360px] overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
              {logs.length === 0 && <p className="text-white/40">Waiting for sandbox build…</p>}
              {logs.map((l, i) => (
                <div key={i} className={cn(l.startsWith("$") ? "text-emerald-300" : l.includes("DENY") ? "text-amber-300" : "text-white/70")}>
                  {l}
                </div>
              ))}
              {active >= 1 && !done && logs.length < dockerLog.length && (
                <div className="mt-1 inline-block h-3 w-2 animate-pulse bg-white/60" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
