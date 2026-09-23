"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check, Copy } from "lucide-react"

export function CodePanel({
  title,
  code,
  language = "json",
  className,
  variant = "plain",
}: {
  title?: string
  code: string
  language?: string
  className?: string
  variant?: "plain" | "diff"
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-[oklch(0.16_0.01_60)]", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="font-mono text-[11px] text-white/60">{title ?? language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed">
        <code className="font-mono">
          {variant === "diff"
            ? code.split("\n").map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    line.startsWith("+") && "bg-emerald-500/15 text-emerald-300",
                    line.startsWith("-") && "bg-red-500/15 text-red-300",
                    line.startsWith("@@") && "text-violet-300",
                    !line.startsWith("+") &&
                      !line.startsWith("-") &&
                      !line.startsWith("@@") &&
                      "text-white/70",
                  )}
                >
                  {line || " "}
                </div>
              ))
            : code.split("\n").map((line, i) => (
                <div key={i} className="text-white/80">
                  {line || " "}
                </div>
              ))}
        </code>
      </pre>
    </div>
  )
}
