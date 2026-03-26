import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { llmService } from '@/lib/llm-service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const today = new Date().toISOString().split('T')[0];

    const db = await getDb();

    // 건강 프로필
    const profileRow = await db.get(
      'SELECT profile_data FROM health_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    const healthProfile = profileRow ? JSON.parse(profileRow.profile_data) : null;

    // 오늘의 이벤트
    const todayEvents = await db.all(
      'SELECT * FROM timeline_events WHERE user_id = ? AND event_date = ?',
      [userId, today]
    );

    // 최근 요약
    const recentSummaries = await db.all(`
      SELECT ss.summary, ss.category
      FROM session_summaries ss
      JOIN chat_sessions cs ON ss.session_id = cs.id
      WHERE cs.user_id = ?
      ORDER BY cs.session_date DESC
      LIMIT 5
    `, [userId]);

    // LLM으로 점수 계산
    const scoreData = await llmService.calculateHealthScore({
      healthProfile,
      todayEvents,
      recentSummaries: recentSummaries.map(s => `${s.category}: ${s.summary}`)
    });

    // 일일 기록에 저장
    await db.run(`
      INSERT OR REPLACE INTO daily_diary (user_id, diary_date, content, health_score)
      VALUES (?, ?, ?, ?)
    `, [userId, today, JSON.stringify(scoreData), scoreData.score]);

    return NextResponse.json(scoreData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
