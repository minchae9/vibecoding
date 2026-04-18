import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const transports = await sql`SELECT * FROM transports`
  return NextResponse.json(transports)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { from_place_id, to_place_id, mode, duration_min, route_path } = body

  const existing = await sql`
    SELECT id FROM transports WHERE from_place_id = ${from_place_id} AND to_place_id = ${to_place_id}
  `

  if (existing.length > 0) {
    const result = await sql`
      UPDATE transports SET mode = ${mode}, duration_min = ${duration_min}, route_path = ${JSON.stringify(route_path)}
      WHERE from_place_id = ${from_place_id} AND to_place_id = ${to_place_id}
      RETURNING *
    `
    return NextResponse.json(result[0])
  }

  const result = await sql`
    INSERT INTO transports (from_place_id, to_place_id, mode, duration_min, route_path)
    VALUES (${from_place_id}, ${to_place_id}, ${mode}, ${duration_min}, ${JSON.stringify(route_path)})
    RETURNING *
  `
  return NextResponse.json(result[0])
}
