import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null

function getSQL() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

export async function initDB() {
  const sql = getSQL()
  await sql`
    CREATE TABLE IF NOT EXISTS places (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      visit_time TEXT,
      duration_min INTEGER,
      memo TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      is_visited BOOLEAN NOT NULL DEFAULT false,
      address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS transports (
      id SERIAL PRIMARY KEY,
      from_place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
      to_place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
      mode TEXT NOT NULL DEFAULT 'walk',
      duration_min INTEGER,
      route_path JSONB
    )
  `
}

export function sql() {
  return getSQL()
}
