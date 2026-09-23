"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { SidebarNav } from "./sidebar-nav"
import { TopBar } from "./top-bar"
import { PresentationPanel } from "./presentation-mode"
import { FOOTER_NOTE } from "@/lib/mock-data"
import { Toaster } from "@/components/ui/sonner"

type AppContextValue = {
  presentationOpen: boolean
  setPresentationOpen: (v: boolean) => void
  mobileNavOpen: boolean
  setMobileNavOpen: (v: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppShell")
  return ctx
}

export function AppShell({ children }: { children: ReactNode }) {
  const [presentationOpen, setPresentationOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <AppContext.Provider value={{ presentationOpen, setPresentationOpen, mobileNavOpen, setMobileNavOpen }}>
      <div className="min-h-screen bg-background text-foreground">
        <SidebarNav />
        <div className="lg:pl-64">
          <TopBar />
          <main className="mx-auto w-full max-w-[1400px] px-5 py-6 lg:px-8 lg:py-8">{children}</main>
          <footer className="mx-auto w-full max-w-[1400px] px-5 pb-10 lg:px-8">
            <div className="mt-4 border-t border-border pt-4">
              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">{FOOTER_NOTE}</p>
            </div>
          </footer>
        </div>
        <PresentationPanel />
        <Toaster position="bottom-right" />
      </div>
    </AppContext.Provider>
  )
}
