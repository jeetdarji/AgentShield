"use client"

import { useApp } from "./app-shell"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X, Presentation, ArrowRight } from "lucide-react"

const script = [
  { title: "Agents overview", href: "/agents", point: "ShopEase is BLOCKED — 4 added / 1 expanded capability." },
  { title: "Agent detail", href: "/agents/shopease", point: "Approved baseline v2.4: refund ≤ $100, delete/email forbidden." },
  { title: "Compare v2.4 vs v2.5", href: "/compare", point: 'Semantic diff (4 added, 1 expanded) vs raw code diff ("feature added").' },
  { title: "Regression run", href: "/regression", point: "38 tests vs 500, 2 critical failures, prompt-injection $450 refund." },
  { title: "Deployment gate", href: "/gate", point: 'BLOCK, then "Fix and revalidate" → v2.5.1 → PASS.' },
  { title: "Research Lab", href: "/research", point: "Targeted vs full comparison, novelty and limitations." },
]

export function PresentationPanel() {
  const { presentationOpen, setPresentationOpen } = useApp()
  const router = useRouter()

  if (!presentationOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Presentation className="h-4 w-4" />
          <span className="font-display text-base">Demo Script</span>
        </div>
        <button onClick={() => setPresentationOpen(false)} aria-label="Close presentation mode">
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      <ol className="max-h-[60vh] overflow-y-auto p-3">
        {script.map((s, i) => (
          <li key={s.href} className="mb-2 rounded-lg border border-border p-3 last:mb-0">
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-medium text-background">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.point}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1.5 h-7 gap-1 px-2 text-xs"
                  onClick={() => router.push(s.href)}
                >
                  Go to screen
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
