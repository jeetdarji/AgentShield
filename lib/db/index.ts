import "server-only"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const g = globalThis as unknown as { __agentshieldPool?: Pool }

export const pool = g.__agentshieldPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
if (process.env.NODE_ENV !== "production") g.__agentshieldPool = pool

export const db = drizzle(pool, { schema })
