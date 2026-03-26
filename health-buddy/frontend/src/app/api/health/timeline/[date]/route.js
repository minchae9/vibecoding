import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const date = params.date || new Date().toISOString().split('T')[0];

    const db = await getDb();

    const events = await db.all(
      'SELECT * FROM timeline_events WHERE user_id = ? AND event_date = ? ORDER BY event_time',
      [userId, date]
    );

    return NextResponse.json({ events, date });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
