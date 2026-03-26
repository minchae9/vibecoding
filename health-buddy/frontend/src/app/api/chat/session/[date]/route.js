import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const date = params.date || getTodayDate();

    const db = await getDb();

    const session = await db.get(
      'SELECT * FROM chat_sessions WHERE user_id = ? AND session_date = ?',
      [userId, date]
    );

    if (!session) {
      return NextResponse.json({ messages: [], sessionId: null });
    }

    const messages = await db.all(
      'SELECT role, content, timestamp FROM chat_messages WHERE session_id = ? ORDER BY timestamp',
      [session.id]
    );

    return NextResponse.json({ messages, sessionId: session.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
