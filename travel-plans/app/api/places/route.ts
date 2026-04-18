import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const places = await sql`SELECT * FROM places ORDER BY order_index ASC`
  return NextResponse.json(places)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, category, lat, lng, visit_time, duration_min, memo, order_index, address } = body

  const result = await sql`
    INSERT INTO places (name, category, lat, lng, visit_time, duration_min, memo, order_index, address)
    VALUES (${name}, ${category}, ${lat}, ${lng}, ${visit_time}, ${duration_min}, ${memo}, ${order_index}, ${address})
    RETURNING *
  `
  return NextResponse.json(result[0])
}
