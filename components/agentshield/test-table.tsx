"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { type TestCase, type TestCategory, runtimeTrace, regoSnippet } from "@/lib/mock-data"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { CodePanel } from "./code-panel"
import { PathFlow } from "./path-flow"
import { DeterministicBadge } from "./badges"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

const categories: (TestCategory | "All")[] = ["All", "Normal", "Boundary", "Misuse", "Path", "Adaptive"]

function ResultPill({ result, critical }: { result: "PASS" | "FAIL"; critical?: boolean }) {
  if (result === "PASS")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> PASS
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] text-red-700">
      <XCircle className="h-3 w-3" /> FAIL{critical ? " · critical" : ""}
    </span>
  )
}

export function TestTable({ tests, showFilters = true }: { tests: TestCase[]; showFilters?: boolean }) {
  const [cat, setCat] = useState<(typeof categories)[number]>("All")
  const [resultFilter, setResultFilter] = useState<"All" | "PASS" | "FAIL">("All")
  const [selected, setSelected] = useState<TestCase | null>(null)

  const filtered = tests.filter(
    (t) => (cat === "All" || t.category === cat) && (resultFilter === "All" || t.result === resultFilter),
  )

  return (
    <div>
      {showFilters && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                  cat === c ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1">
            {(["All", "PASS", "FAIL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setResultFilter(r)}
                className={cn(
                  "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                  resultFilter === r ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">ID</th>
              <th className="px-3 py-2.5 font-medium">Test</th>
              <th className="px-3 py-2.5 font-medium">Category</th>
              <th className="px-3 py-2.5 font-medium">Why selected</th>
              <th className="px-3 py-2.5 font-medium">Result</th>
              <th className="px-3 py-2.5 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelected(t)}
                className={cn(
                  "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/50",
                  t.result === "FAIL" && "bg-red-50/50",
                )}
              >
                <td className="px-3 py-2.5 font-mono text-xs">{t.id}</td>
                <td className="max-w-[280px] px-3 py-2.5">
                  <span className="line-clamp-2">{t.name}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {t.category}
                  </span>
                </td>
                <td className="max-w-[220px] px-3 py-2.5 text-xs text-muted-foreground">
                  <span className="line-clamp-2">{t.whySelected}</span>
                </td>
                <td className="px-3 py-2.5">
                  <ResultPill result={t.result} critical={t.critical} />
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{t.duration}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No tests match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-mono text-base">
                  {selected.id}
                  <ResultPill result={selected.result} critical={selected.critical} />
                </SheetTitle>
                <SheetDescription>{selected.name}</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-8">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border p-3">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">Expected</p>
                    <p className="mt-1">{selected.expected}</p>
                  </div>
                  <div
                    className={cn(
                      "rounded-md border p-3",
                      selected.result === "FAIL" ? "border-red-200 bg-red-50" : "border-border",
                    )}
                  >
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">Actual</p>
                    <p className="mt-1">{selected.actual}</p>
                  </div>
                </div>

                {selected.critical && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Critical authorization regression — this attack path bypasses the human-approval boundary.</span>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-medium">Attack path</p>
                  <PathFlow />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Runtime trace</p>
                  <ol className="space-y-2">
                    {runtimeTrace.map((s) => (
                      <li key={s.step} className="flex gap-3 rounded-md border border-border p-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] text-background">
                          {s.step}
                        </span>
                        <div>
                          <p className="text-xs font-medium">{s.label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Policy decision</p>
                    <DeterministicBadge />
                  </div>
                  <CodePanel code={regoSnippet} language="rego" title="authz.rego" />
                </div>

                <Button variant="outline" className="w-full" onClick={() => setSelected(null)}>
                  Close trace
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
