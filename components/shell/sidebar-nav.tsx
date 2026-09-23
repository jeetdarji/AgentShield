"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useApp } from "./app-shell"
import { cn } from "@/lib/utils"
import {
  Boxes,
  UploadCloud,
  Bot,
  GitCompareArrows,
  FlaskConical,
  ShieldCheck,
  GitPullRequestArrow,
  FileArchive,
  Microscope,
  Workflow,
  ShieldHalf,
  X,
} from "lucide-react"

const nav = [
  { href: "/agents", label: "Agents", icon: Boxes, hint: "Organization overview" },
  { href: "/onboard", label: "Onboard Agent", icon: UploadCloud, hint: "F1" },
  { href: "/agents/shopease", label: "Agent Detail", icon: Bot, hint: "ShopEase" },
  { href: "/compare", label: "Version Comparison", icon: GitCompareArrows, hint: "Capability diff" },
  { href: "/regression", label: "Regression Run", icon: FlaskConical, hint: "Targeted tests" },
  { href: "/gate", label: "Deployment Gate", icon: ShieldCheck, hint: "PASS / BLOCK" },
  { href: "/cicd", label: "CI/CD Integration", icon: GitPullRequestArrow, hint: "PR gate" },
  { href: "/evidence", label: "Evidence & Audit", icon: FileArchive, hint: "Compliance" },
  { href: "/research", label: "Research Lab", icon: Microscope, hint: "Benchmarks" },
  { href: "/how-it-works", label: "How It Works", icon: Workflow, hint: "Architecture" },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { mobileNavOpen, setMobileNavOpen } = useApp()

  const isActive = (href: string) => pathname === href || (href !== "/agents" && pathname.startsWith(href))

  return (
    <>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/agents" className="flex items-center gap-2" onClick={() => setMobileNavOpen(false)}>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <ShieldHalf className="h-4 w-4" />
            </span>
            <span className="font-display text-xl tracking-tight">AgentShield</span>
          </Link>
          <button className="lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Authorization Regression
          </p>
          <ul className="flex flex-col gap-0.5">
            {nav.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-foreground/70 hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    <span
                      className={cn(
                        "font-mono text-[10px]",
                        active ? "text-background/60" : "text-muted-foreground/70",
                      )}
                    >
                      {item.hint}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Deterministic engine · OPA/Rego
          </div>
        </div>
      </aside>
    </>
  )
}
