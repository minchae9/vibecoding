import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const db = sql()
  const items: { id: number; order_index: number }[] = await req.json()
  await Promise.all(
    items.map(({ id, order_index }) =>
      db`UPDATE places SET order_index = ${order_index} WHERE id = ${id}`
    )
  )
  return NextResponse.json({ ok: true })
}
