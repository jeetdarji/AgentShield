import { integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"
import type { PolicyRule, RunEvent, RunResult } from "@/lib/pipeline/types"

export const runs = pgTable("runs", {
  runId: text("run_id").primaryKey(),
  status: text("status").$type<RunResult["status"]>().notNull(),
  trigger: text("trigger").notNull().default("manual"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  finalDecision: text("final_decision").$type<NonNullable<RunResult["final_decision"]>>(),
  result: jsonb("result").$type<RunResult>().notNull(),
})

export const runEvents = pgTable(
  "run_events",
  {
    runId: text("run_id").notNull(),
    seq: integer("seq").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull(),
    step: text("step").notNull(),
    event: jsonb("event").$type<RunEvent>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.runId, t.seq] })],
)

export const policyRules = pgTable("policy_rules", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  rule: jsonb("rule").$type<PolicyRule>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const cicdDeliveries = pgTable("cicd_deliveries", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  event: text("event").notNull(),
  ref: text("ref"),
  commitSha: text("commit_sha"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  runId: text("run_id"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
})
