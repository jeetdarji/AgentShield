"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Loader2, AlertTriangle, ArrowUpRight, RotateCcw } from "lucide-react"
import type { CoverageResult, KnownTestResult, LLMCallMeta } from "@/lib/pipeline/types"
import { SEED_RULE_IDS, type LiveUnknown } from "./run-state"

export function CoverageRouting({ coverage }: { coverage: CoverageResult[] }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {coverage.map((c) => (
        <li key={c.capability_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 font-mono text-xs">
          <span className="min-w-32 font-medium text-foreground">{c.capability_id}</span>
          <span className="text-muted-foreground">{c.change_type}</span>
          <span aria-hidden className="text-muted-foreground">{"→"}</span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px]",
              c.status === "KNOWN"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-800",
            )}
          >
            {c.status}
          </span>
          <span aria-hidden className="text-muted-foreground">{"→"}</span>
          {c.status === "KNOWN" ? (
            <span>
              fixed rule <strong className="font-medium">{c.matched_rule_id}</strong>
              {c.matched_rule_id && !SEED_RULE_IDS.has(c.matched_rule_id) && (
                <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background">promoted</span>
              )}
            </span>
          ) : (
            <span className="text-amber-800">redirecting to LLM red-team agent</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function KnownLane({ results }: { results: KnownTestResult[] }) {
  const byRule = new Map<string, KnownTestResult[]>()
  results.forEach((r) => byRule.set(r.rule_id, [...(byRule.get(r.rule_id) ?? []), r]))

  return (
    <section className="flex flex-col gap-3" aria-labelledby="known-lane">
      <header className="flex items-baseline justify-between">
        <h2 id="known-lane" className="font-display text-xl">Known Scenario (Fixed Rules)</h2>
        <span className="font-mono text-[11px] text-muted-foreground">Agent 3 · computed by applying the rule</span>
      </header>
      {results.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No KNOWN capabilities yet.
        </p>
      ) : (
        [...byRule.entries()].map(([ruleId, rows]) => (
          <div key={ruleId} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="font-mono text-xs font-medium">
                {ruleId}
                <span className="ml-2 font-normal text-muted-foreground">on {rows[0].capability_id}</span>
              </p>
              {!SEED_RULE_IDS.has(ruleId) && (
                <span className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] text-background">promoted from LLM finding</span>
              )}
            </div>
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-normal">Input</th>
                  <th className="px-4 py-2 font-normal">Expected</th>
                  <th className="px-4 py-2 font-normal">Actual</th>
                  <th className="px-4 py-2 text-right font-normal">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td className="px-4 py-2">{r.label}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.expected}</td>
                    <td className="px-4 py-2">{r.actual}</td>
                    <td className={cn("px-4 py-2 text-right font-medium", r.pass ? "text-emerald-700" : "text-red-700")}>
                      {r.pass ? "PASS" : "FAIL"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </section>
  )
}

function RawOutput({ label, meta }: { label: string; meta?: LLMCallMeta }) {
  if (!meta) return null
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground [&[data-state=open]>svg]:rotate-180">
        <ChevronDown className="h-3 w-3 transition-transform" aria-hidden />
        Generated by LLM — raw output ({label})
      </CollapsibleTrigger>
      <CollapsibleContent>
        {meta.raw_responses.map((r, i) => (
          <pre
            key={i}
            className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md bg-foreground p-3 font-mono text-[11px] leading-relaxed text-background"
          >
            {meta.raw_responses.length > 1 && `// attempt ${i + 1}\n`}
            {r}
          </pre>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function MetaLine({ meta }: { meta?: LLMCallMeta }) {
  if (!meta) return null
  return (
    <span className="font-mono text-[10px] text-muted-foreground">
      {meta.model} · {(meta.latency_ms / 1000).toFixed(1)}s{meta.attempts > 1 ? ` · ${meta.attempts} attempts` : ""}
    </span>
  )
}

function Pending({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> {text}
    </p>
  )
}

function UnknownCard({
  u,
  promoted,
  promoting,
  onPromote,
  onRetry,
}: {
  u: LiveUnknown
  promoted: boolean
  promoting: boolean
  onPromote: () => void
  onRetry: () => void
}) {
  const v = u.verdict?.verdict
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-card p-4",
        v === "VIOLATION" && "border-red-300",
        v === "SAFE" && "border-emerald-300",
        u.status === "error" && "border-red-300 bg-red-50/60",
        !v && u.status !== "error" && "border-border",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-sm font-medium">{u.capability_id}</p>
        {v && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium",
              v === "VIOLATION" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {v}
          </span>
        )}
      </header>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase text-muted-foreground">1 · Adversarial ticket (Agent 4)</p>
        {u.test_case ? (
          <>
            <blockquote className="border-l-2 border-foreground/20 pl-3 text-sm leading-relaxed">{u.test_case.ticket_text}</blockquote>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Hidden instruction:</span> {u.test_case.hidden_instruction_summary}
            </p>
            <MetaLine meta={u.test_case_meta} />
            <RawOutput label="Agent 4" meta={u.test_case_meta} />
          </>
        ) : u.activeStage === "generator" ? (
          <Pending text="Red-team model is writing a ticket…" />
        ) : null}
      </div>

      {(u.decision || u.activeStage === "target") && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">2 · Target agent decision (Agent 5a)</p>
          {u.decision ? (
            <>
              <p className="text-sm">
                {u.decision.refused ? (
                  <span className="font-medium text-emerald-700">Refused</span>
                ) : (
                  <>
                    Called <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{u.decision.tool_called ?? "nothing"}</code>
                  </>
                )}
              </p>
              {u.decision.tool_arguments && (
                <pre className="overflow-auto rounded-md bg-muted p-2 font-mono text-[11px]">{JSON.stringify(u.decision.tool_arguments, null, 2)}</pre>
              )}
              <p className="text-xs text-muted-foreground">{u.decision.agent_reasoning_summary}</p>
              <MetaLine meta={u.decision_meta} />
              <RawOutput label="Agent 5a" meta={u.decision_meta} />
            </>
          ) : (
            <Pending text="ShopEase v2.5 agent is deciding…" />
          )}
        </div>
      )}

      {(u.verdict || u.activeStage === "judge") && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">3 · Judge verdict (Agent 5b)</p>
          {u.verdict ? (
            <>
              <p className="text-sm leading-relaxed">{u.verdict.reason}</p>
              {u.verdict.verdict === "VIOLATION" && (
                <p className="text-xs text-red-700">
                  <span className="font-medium">Baseline broken:</span> {u.verdict.which_baseline_assumption_broken}
                </p>
              )}
              <MetaLine meta={u.verdict_meta} />
              <RawOutput label="Agent 5b" meta={u.verdict_meta} />
            </>
          ) : (
            <Pending text="Judge is auditing the action…" />
          )}
        </div>
      )}

      {u.status === "error" && u.error && (
        <div role="alert" className="flex flex-col gap-2 rounded-md border border-red-300 bg-red-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-red-700">
            <AlertTriangle className="h-4 w-4" aria-hidden /> LLM call failed ({u.error.stage})
          </p>
          <p className="break-words font-mono text-[11px] leading-relaxed text-red-700/90">{u.error.message}</p>
          {u.error.raw_responses.length > 0 && (
            <RawOutput label="failed attempts" meta={{ model: "", latency_ms: 0, attempts: 0, raw_responses: u.error.raw_responses }} />
          )}
          <Button size="sm" variant="outline" className="w-fit gap-2 rounded-full bg-transparent" onClick={onRetry}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Retry run
          </Button>
        </div>
      )}

      {v === "VIOLATION" && u.test_case && (
        <div className="border-t border-border pt-3">
          {promoted ? (
            <p className="font-mono text-[11px] text-emerald-700">Promoted — this capability will route to fixed rules on the next run.</p>
          ) : (
            <Button size="sm" className="gap-2 rounded-full" onClick={onPromote} disabled={promoting}>
              {promoting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}
              Promote to fixed rule
            </Button>
          )}
        </div>
      )}
    </article>
  )
}

export function UnknownLane({
  unknown,
  promotedCaps,
  promotingCap,
  onPromote,
  onRetry,
}: {
  unknown: LiveUnknown[]
  promotedCaps: Set<string>
  promotingCap: string | null
  onPromote: (u: LiveUnknown) => void
  onRetry: () => void
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="unknown-lane">
      <header className="flex items-baseline justify-between">
        <h2 id="unknown-lane" className="font-display text-xl">Unknown Scenario (LLM Red-Team)</h2>
        <span className="font-mono text-[11px] text-muted-foreground">Agents 4 + 5 · live model calls</span>
      </header>
      {unknown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Every changed capability is covered by a fixed rule — nothing to red-team.
        </p>
      ) : (
        unknown.map((u) => (
          <UnknownCard
            key={u.capability_id}
            u={u}
            promoted={promotedCaps.has(u.capability_id)}
            promoting={promotingCap === u.capability_id}
            onPromote={() => onPromote(u)}
            onRetry={onRetry}
          />
        ))
      )}
    </section>
  )
}
