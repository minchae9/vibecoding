import express from 'express';
import db, { prepare, saveDatabase } from '../database.js';
import llmService from '../llm-service.js';

const router = express.Router();

// 오늘 날짜 가져오기 (YYYY-MM-DD)
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// 시간 블록 계산 (2시간 단위)
function getTimeBlock() {
  const hour = new Date().getHours();
  const start = Math.floor(hour / 2) * 2;
  const end = start + 2;
  return `${start.toString().padStart(2, '0')}-${end.toString().padStart(2, '0')}`;
}

// 세션 가져오기 또는 생성
function getOrCreateSession(userId, date) {
  let session = prepare(`
    SELECT * FROM chat_sessions WHERE user_id = ? AND session_date = ?
  `).get(userId, date);

  if (!session) {
    const result = prepare(`
      INSERT INTO chat_sessions (user_id, session_date) VALUES (?, ?)
    `).run(userId, date);
    session = { id: result.lastInsertRowid, user_id: userId, session_date: date };
  }

  return session;
}

// 건강 프로필 가져오기
function getHealthProfile(userId) {
  return prepare(`
    SELECT profile_data FROM health_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(userId);
}

// 최근 요약 가져오기 (최근 3일)
function getRecentSummaries(userId) {
  return prepare(`
    SELECT ss.summary, ss.category, cs.session_date
    FROM session_summaries ss
    JOIN chat_sessions cs ON ss.session_id = cs.id
    WHERE cs.user_id = ?
    ORDER BY cs.session_date DESC
    LIMIT 10
  `).all(userId);
}

// 타임라인 이벤트 가져오기
function getTimelineEvents(userId, date) {
  return prepare(`
    SELECT * FROM timeline_events WHERE user_id = ? AND event_date = ? ORDER BY event_time
  `).all(userId, date);
}

// 메시지 저장
function saveMessage(sessionId, role, content) {
  return prepare(`
    INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)
  `).run(sessionId, role, content);
}

// 세션 메시지 가져오기
function getSessionMessages(sessionId) {
  return prepare(`
    SELECT role, content, timestamp FROM chat_messages WHERE session_id = ? ORDER BY timestamp
  `).all(sessionId);
}

// 채팅 API
router.post('/message', async (req, res) => {
  try {
    const { message, userId = 'default' } = req.body;
    const today = getTodayDate();

    // 세션 확인/생성
    const session = getOrCreateSession(userId, today);

    // 컨텍스트 구성
    const profileRow = getHealthProfile(userId);
    const healthProfile = profileRow ? JSON.parse(profileRow.profile_data) : null;
    const recentSummaries = getRecentSummaries(userId).map(s =>
      `[${s.session_date}] ${s.category}: ${s.summary}`
    );
    const todayEvents = getTimelineEvents(userId, today);

    // 기존 메시지 가져오기
    const existingMessages = getSessionMessages(session.id);

    // 사용자 메시지 저장
    saveMessage(session.id, 'user', message);

    // LLM에 전달할 메시지 구성
    const messages = [
      ...existingMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // LLM 호출
    const response = await llmService.chat(messages, {
      healthProfile,
      recentSummaries,
      todayEvents
    });

    // 어시스턴트 응답 저장
    saveMessage(session.id, 'assistant', response);

    // 타임라인 이벤트 추출 (간단한 키워드 기반)
    extractAndSaveEvents(userId, today, message);

    res.json({ response, sessionId: session.id });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 세션 기록 가져오기
router.get('/session/:date?', (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const date = req.params.date || getTodayDate();

    const session = prepare(`
      SELECT * FROM chat_sessions WHERE user_id = ? AND session_date = ?
    `).get(userId, date);

    if (!session) {
      return res.json({ messages: [], sessionId: null });
    }

    const messages = getSessionMessages(session.id);
    res.json({ messages, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 대화 요약 (2시간 단위)
router.post('/summarize', async (req, res) => {
  try {
    const { userId = 'default' } = req.body;
    const today = getTodayDate();
    const timeBlock = getTimeBlock();

    const session = getOrCreateSession(userId, today);
    const messages = getSessionMessages(session.id);

    if (messages.length === 0) {
      return res.json({ summary: null, message: '요약할 대화가 없습니다.' });
    }

    // LLM으로 요약
    const summary = await llmService.summarizeConversation(messages);

    // 각 카테고리별로 저장
    for (const [category, content] of Object.entries(summary)) {
      if (content) {
        prepare(`
          INSERT INTO session_summaries (session_id, time_block, category, summary)
          VALUES (?, ?, ?, ?)
        `).run(session.id, timeBlock, category, content);
      }
    }

    res.json({ summary, timeBlock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 일일 요약 가져오기
router.get('/daily-summary/:date?', (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const date = req.params.date || getTodayDate();

    const session = prepare(`
      SELECT id FROM chat_sessions WHERE user_id = ? AND session_date = ?
    `).get(userId, date);

    if (!session) {
      return res.json({ summaries: [] });
    }

    const summaries = prepare(`
      SELECT time_block, category, summary FROM session_summaries
      WHERE session_id = ? ORDER BY time_block
    `).all(session.id);

    res.json({ summaries, date });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 메시지에서 이벤트 추출하여 저장
function extractAndSaveEvents(userId, date, message) {
  const lowerMessage = message.toLowerCase();
  const now = new Date().toTimeString().split(' ')[0];

  // 식사 관련
  const mealKeywords = ['먹었', '식사', '점심', '아침', '저녁', '먹고', '간식'];
  if (mealKeywords.some(k => lowerMessage.includes(k))) {
    const mealType = lowerMessage.includes('아침') ? '아침' :
                     lowerMessage.includes('점심') ? '점심' :
                     lowerMessage.includes('저녁') ? '저녁' : '식사';

    prepare(`
      INSERT INTO timeline_events (user_id, event_date, event_time, event_type, title, description)
      VALUES (?, ?, ?, 'meal', ?, ?)
    `).run(userId, date, now, mealType, message.substring(0, 100));
  }

  // 활동 관련
  const activityKeywords = ['운동', '걷', '달리', '수영', '헬스', '요가', '산책'];
  if (activityKeywords.some(k => lowerMessage.includes(k))) {
    prepare(`
      INSERT INTO timeline_events (user_id, event_date, event_time, event_type, title, description)
      VALUES (?, ?, ?, 'activity', '운동/활동', ?)
    `).run(userId, date, now, message.substring(0, 100));
  }

  // 상태 관련
  const statusKeywords = ['피곤', '졸', '기분', '아프', '좋', '나쁘', '힘들'];
  if (statusKeywords.some(k => lowerMessage.includes(k))) {
    prepare(`
      INSERT INTO timeline_events (user_id, event_date, event_time, event_type, title, description)
      VALUES (?, ?, ?, 'status', '상태 체크', ?)
    `).run(userId, date, now, message.substring(0, 100));
  }
}

export default router;
