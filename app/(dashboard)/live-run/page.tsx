import type { Metadata } from "next"
import { LiveRunClient } from "@/components/live-run/live-run-client"

export const metadata: Metadata = {
  title: "Live Run · AgentShield",
  description: "Real ShopEase v2.4 → v2.5 authorization regression pipeline with live LLM red-teaming.",
}

export default function LiveRunPage() {
  return <LiveRunClient />
}
