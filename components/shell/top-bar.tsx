"use client"

import { useApp } from "./app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, Search, Presentation } from "lucide-react"
import { cn } from "@/lib/utils"

export function TopBar() {
  const { presentationOpen, setPresentationOpen, setMobileNavOpen } = useApp()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-5 lg:px-8">
        <button
          className="lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="font-display text-lg tracking-tight">ShopEase Inc.</span>
          <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] text-amber-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Sandbox · synthetic data
          </span>
        </div>

        <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search agents, policies, runs…" className="h-9 rounded-full pl-9" />
        </div>

        <Button
          variant={presentationOpen ? "default" : "outline"}
          size="sm"
          onClick={() => setPresentationOpen(!presentationOpen)}
          className={cn("gap-2 rounded-full", !presentationOpen && "border-foreground/20")}
        >
          <Presentation className="h-4 w-4" />
          <span className="hidden sm:inline">Presentation Mode</span>
        </Button>

        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-foreground text-background text-xs">SE</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
