import { NextResponse } from 'next/server'
import { initDB } from '@/lib/db'

export async function GET() {
  await initDB()
  return NextResponse.json({ ok: true })
}
