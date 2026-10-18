import pg from 'pg'

const statements = [
  `CREATE TABLE IF NOT EXISTS runs (run_id text PRIMARY KEY, status text NOT NULL, trigger text NOT NULL DEFAULT 'manual', started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz, final_decision text, result jsonb NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS runs_started_at_idx ON runs (started_at DESC)`,
  `CREATE TABLE IF NOT EXISTS run_events (run_id text NOT NULL, seq integer NOT NULL, at timestamptz NOT NULL, step text NOT NULL, event jsonb NOT NULL, PRIMARY KEY (run_id, seq))`,
  `CREATE TABLE IF NOT EXISTS policy_rules (id text PRIMARY KEY, source text NOT NULL, rule jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS cicd_deliveries (id text PRIMARY KEY, provider text NOT NULL, event text NOT NULL, ref text, commit_sha text, payload jsonb NOT NULL, run_id text, received_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS cicd_deliveries_received_idx ON cicd_deliveries (received_at DESC)`,
]

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  await client.query('BEGIN')
  for (const sql of statements) await client.query(sql)
  await client.query('COMMIT')
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
  )
  console.log('tables:', rows.map((r) => r.table_name).join(', '))
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  await client.end()
}
