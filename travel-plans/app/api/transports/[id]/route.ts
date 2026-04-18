import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = sql()
  const { id } = await params
  await db`DELETE FROM transports WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
