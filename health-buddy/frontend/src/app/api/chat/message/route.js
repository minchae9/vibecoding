import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { llmService } from '@/lib/llm-service';

// 오늘 날짜
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// 시간 블록 (2시간 단위)
function getTimeBlock() {
  const hour = new Date().getHours();
  const start = Math.floor(hour / 2) * 2;
  const end = start + 2;
  return `${start.toString().padStart(2, '0')}-${end.toString().padStart(2, '0')}`;
}

export async function POST(request) {
  try {
    const { message, userId = 'default' } = await request.json();
    const today = getTodayDate();
    const db = await getDb();

    // 세션 확인/생성
    let session = await db.get(
      'SELECT * FROM chat_sessions WHERE user_id = ? AND session_date = ?',
      [userId, today]
    );

    if (!session) {
      const result = await db.run(
        'INSERT INTO chat_sessions (user_id, session_date) VALUES (?, ?)',
        [userId, today]
      );
      session = { id: result.lastID, user_id: userId, session_date: today };
    }

    // 컨텍스트 구성
    const profileRow = await db.get(
      'SELECT profile_data FROM health_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    const healthProfile = profileRow ? JSON.parse(profileRow.profile_data) : null;

    const recentSummaries = await db.all(`
      SELECT ss.summary, ss.category, cs.session_date
      FROM session_summaries ss
      JOIN chat_sessions cs ON ss.session_id = cs.id
      WHERE cs.user_id = ?
      ORDER BY cs.session_date DESC
      LIMIT 10
    `, [userId]);

    const todayEvents = await db.all(
      'SELECT * FROM timeline_events WHERE user_id = ? AND event_date = ? ORDER BY event_time',
      [userId, today]
    );

    // 기존 메시지
    const existingMessages = await db.all(
      'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY timestamp',
      [session.id]
    );

    // 사용자 메시지 저장
    await db.run(
      'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
      [session.id, 'user', message]
    );

    // LLM 호출
    const messages = [
      ...existingMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await llmService.chat(messages, {
      healthProfile,
      recentSummaries: recentSummaries.map(s => `[${s.session_date}] ${s.category}: ${s.summary}`),
      todayEvents
    });

    // 어시스턴트 응답 저장
    await db.run(
      'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
      [session.id, 'assistant', response]
    );

    // 타임라인 이벤트 추출
    await extractAndSaveEvents(db, userId, today, message);

    return NextResponse.json({ response, sessionId: session.id });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function extractAndSaveEvents(db, userId, date, message) {
  const lowerMessage = message.toLowerCase();
  const now = new Date().toTimeString().split(' ')[0];

  const mealKeywords = ['먹었', '식사', '점심', '아침', '저녁', '먹고', '간식'];
  if (mealKeywords.some(k => lowerMessage.includes(k))) {
    const mealType = lowerMessage.includes('아침') ? '아침' :
                     lowerMessage.includes('점심') ? '점심' :
                     lowerMessage.includes('저녁') ? '저녁' : '식사';
    await db.run(
      'INSERT INTO timeline_events (user_id, event_date, event_time, event_type, title, description) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, date, now, 'meal', mealType, message.substring(0, 100)]
    );
  }

  const activityKeywords = ['운동', '걷', '달리', '수영', '헬스', '요가', '산책'];
  if (activityKeywords.some(k => lowerMessage.includes(k))) {
    await db.run(
      'INSERT INTO timeline_events (user_id, event_date, event_time, event_type, title, description) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, date, now, 'activity', '운동/활동', message.substring(0, 100)]
    );
  }

  const statusKeywords = ['피곤', '졸', '기분', '아프', '좋', '나쁘', '힘들'];
  if (statusKeywords.some(k => lowerMessage.includes(k))) {
    await db.run(
      'INSERT INTO timeline_events (user_id, event_date, event_time, event_type, title, description) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, date, now, 'status', '상태 체크', message.substring(0, 100)]
    );
  }
}
