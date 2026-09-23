"use client"

import {
  researchQuestion,
  hypothesisH1,
  subQuestions,
  benchmarkDesign,
  feasibilityGate,
  baselineComparison,
  metricsGlossary,
  noveltyTable,
  notClaimed,
  limitations,
  futureWork,
  references,
} from "@/lib/mock-data"
import { PageHeader } from "@/components/agentshield/page-header"
import { cn } from "@/lib/utils"
import { HelpCircle, FlaskConical, BarChart3, BookOpen, Ban, TriangleAlert, Sparkles } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, Cell } from "recharts"

function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-2xl tracking-tight">
      <Icon className="h-5 w-5 text-muted-foreground" />
      {children}
    </h2>
  )
}

export default function ResearchPage() {
  const shortName = (m: string) => m.split(" ")[0]

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Research Lab · evaluation & benchmarks"
        title="Research Lab"
        description="The scientific framing behind AgentShield — research question, hypothesis, benchmark design, baselines, and novelty."
      />

      {/* a) Research question */}
      <section>
        <SectionTitle icon={HelpCircle}>Research question & hypothesis</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-foreground/20 bg-foreground/[0.03] p-6">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Research question</p>
            <p className="font-display text-lg leading-snug">{researchQuestion}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-emerald-700">Hypothesis H1</p>
            <p className="text-sm leading-relaxed text-emerald-900">{hypothesisH1}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {subQuestions.map((q) => (
            <div key={q.id} className="rounded-lg border border-border bg-card p-4">
              <p className="font-mono text-xs font-semibold text-foreground">{q.id}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{q.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* b) Benchmark design */}
      <section>
        <SectionTitle icon={FlaskConical}>Benchmark design</SectionTitle>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Dimension</th>
                  <th className="px-3 py-2.5 font-medium">Target</th>
                  <th className="px-3 py-2.5 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkDesign.map((b) => (
                  <tr key={b.dimension} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2.5 font-medium">{b.dimension}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{b.value}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{b.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-amber-700">Feasibility gate · mini-benchmark</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Agents", feasibilityGate.agents],
                ["Tools", feasibilityGate.tools],
                ["Mutations", feasibilityGate.mutations],
                ["Regression cases", feasibilityGate.regressionCases],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border border-amber-200 bg-white/60 p-3 text-center">
                  <p className="font-display text-2xl text-amber-800">{v}</p>
                  <p className="font-mono text-[10px] uppercase text-amber-700">{k}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* c) Baseline comparison */}
      <section>
        <SectionTitle icon={BarChart3}>Baseline comparison</SectionTitle>
        <p className="mb-4 inline-block rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 font-mono text-[11px] text-amber-700">
          Illustrative prototype numbers — not real experimental results
        </p>
        <div className="mb-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Method</th>
                <th className="px-3 py-2.5 font-medium">Detection</th>
                <th className="px-3 py-2.5 font-medium">Coverage</th>
                <th className="px-3 py-2.5 font-medium">Tests run</th>
                <th className="px-3 py-2.5 font-medium">Reduction</th>
                <th className="px-3 py-2.5 font-medium">False reval</th>
                <th className="px-3 py-2.5 font-medium">Time</th>
                <th className="px-3 py-2.5 font-medium">Legit success</th>
                <th className="px-3 py-2.5 font-medium">Adaptive attack</th>
              </tr>
            </thead>
            <tbody>
              {baselineComparison.map((b) => (
                <tr key={b.method} className={cn("border-b border-border/60 last:border-0", b.ours && "bg-emerald-50/60 font-medium")}>
                  <td className="px-3 py-2.5">{b.method}{b.ours && <span className="ml-2 rounded border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] text-emerald-700">OURS</span>}</td>
                  <td className="px-3 py-2.5">{b.detection}%</td>
                  <td className="px-3 py-2.5">{b.coverage}%</td>
                  <td className="px-3 py-2.5">{b.testsRun}</td>
                  <td className="px-3 py-2.5">{b.reduction}%</td>
                  <td className="px-3 py-2.5">{b.falseReval}%</td>
                  <td className="px-3 py-2.5">{b.time}s</td>
                  <td className="px-3 py-2.5">{b.legitSuccess}%</td>
                  <td className="px-3 py-2.5">{b.adaptiveAttack}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-4 font-display text-base">Tests run per method (lower is cheaper)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={baselineComparison} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="method" tickFormatter={shortName} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <RTooltip cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="testsRun" radius={[4, 4, 0, 0]}>
                  {baselineComparison.map((b, i) => (
                    <Cell key={i} fill={b.ours ? "oklch(0.6 0.13 155)" : "var(--color-chart-3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-4 font-display text-base">Adaptive attack success (lower is safer)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={baselineComparison} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="method" tickFormatter={shortName} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} unit="%" tickLine={false} axisLine={false} />
                <RTooltip cursor={{ fill: "var(--color-muted)" }} formatter={(v) => [`${v}%`, "attack success"]} />
                <Bar dataKey="adaptiveAttack" radius={[4, 4, 0, 0]}>
                  {baselineComparison.map((b, i) => (
                    <Cell key={i} fill={b.ours ? "oklch(0.6 0.13 155)" : "var(--color-destructive)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* d) Metrics glossary */}
      <section>
        <SectionTitle icon={BookOpen}>Primary metrics glossary</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metricsGlossary.map((m) => (
            <div key={m.term} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium">{m.term}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.def}</p>
            </div>
          ))}
        </div>
      </section>

      {/* e) Novelty */}
      <section>
        <SectionTitle icon={Sparkles}>Research gap & novelty</SectionTitle>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Existing direction</th>
                <th className="px-3 py-2.5 font-medium">Already studied?</th>
                <th className="px-3 py-2.5 font-medium">Our relationship</th>
              </tr>
            </thead>
            <tbody>
              {noveltyTable.map((n) => {
                const focus = n.relationship === "OUR FOCUS"
                return (
                  <tr key={n.direction} className={cn("border-b border-border/60 last:border-0", focus && "bg-emerald-50/60")}>
                    <td className="px-3 py-2.5">{n.direction}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{n.studied}</td>
                    <td className={cn("px-3 py-2.5", focus ? "font-medium text-emerald-700" : "text-muted-foreground")}>{n.relationship}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* f) Not claimed / limitations */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionTitle icon={Ban}>What we do NOT claim</SectionTitle>
          <ul className="space-y-2">
            {notClaimed.map((c) => (
              <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionTitle icon={TriangleAlert}>Limitations</SectionTitle>
          <ul className="space-y-2">
            {limitations.map((c) => (
              <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionTitle icon={Sparkles}>Future work</SectionTitle>
          <ul className="space-y-2">
            {futureWork.map((c) => (
              <li key={c} className="flex gap-2 text-sm">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* g) References */}
      <section>
        <SectionTitle icon={BookOpen}>References</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {references.map((r) => (
            <div key={r.id} className="flex gap-3 rounded-lg border border-border bg-card p-3 text-sm">
              <span className="font-mono text-xs font-semibold text-muted-foreground">{r.id}</span>
              <span className="text-xs leading-relaxed">{r.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
