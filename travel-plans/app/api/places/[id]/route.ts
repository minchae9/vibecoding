import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = sql()
  const { id } = await params
  const body = await req.json()
  const { name, category, lat, lng, visit_time, duration_min, memo, order_index, is_visited, address } = body

  const result = await db`
    UPDATE places SET
      name = ${name},
      category = ${category},
      lat = ${lat},
      lng = ${lng},
      visit_time = ${visit_time},
      duration_min = ${duration_min},
      memo = ${memo},
      order_index = ${order_index},
      is_visited = ${is_visited},
      address = ${address}
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json(result[0])
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = sql()
  const { id } = await params
  const body = await req.json()

  if ('is_visited' in body) {
    const result = await db`
      UPDATE places SET is_visited = ${body.is_visited} WHERE id = ${id} RETURNING *
    `
    return NextResponse.json(result[0])
  }

  if ('order_index' in body) {
    const result = await db`
      UPDATE places SET order_index = ${body.order_index} WHERE id = ${id} RETURNING *
    `
    return NextResponse.json(result[0])
  }

  return NextResponse.json({ error: 'no valid field' }, { status: 400 })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = sql()
  const { id } = await params
  await db`DELETE FROM places WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
