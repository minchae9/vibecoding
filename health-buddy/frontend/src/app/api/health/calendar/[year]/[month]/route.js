import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const { year, month } = params;

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const db = await getDb();

    const sessions = await db.all(`
      SELECT cs.session_date, COUNT(cm.id) as message_count
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE cs.user_id = ? AND cs.session_date BETWEEN ? AND ?
      GROUP BY cs.session_date
    `, [userId, startDate, endDate]);

    const events = await db.all(`
      SELECT event_date, event_type, COUNT(*) as count
      FROM timeline_events
      WHERE user_id = ? AND event_date BETWEEN ? AND ?
      GROUP BY event_date, event_type
    `, [userId, startDate, endDate]);

    const scores = await db.all(`
      SELECT diary_date as date, health_score
      FROM daily_diary
      WHERE user_id = ? AND diary_date BETWEEN ? AND ?
    `, [userId, startDate, endDate]);

    return NextResponse.json({ sessions, events, scores });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
