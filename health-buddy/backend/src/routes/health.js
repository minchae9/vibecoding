import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { prepare, saveDatabase } from '../database.js';
import llmService from '../llm-service.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// 업로드 폴더 설정
const uploadDir = join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 건강 프로필 가져오기
router.get('/profile', (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const profile = prepare(`
      SELECT * FROM health_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(userId);

    if (!profile) {
      return res.json({ profile: null });
    }

    res.json({
      profile: {
        ...JSON.parse(profile.profile_data),
        id: profile.id,
        extractedAt: profile.extracted_at,
        pdfFilename: profile.pdf_filename
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PDF 업로드 및 분석
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const { userId = 'default' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일이 필요합니다.' });
    }

    // PDF 텍스트 추출
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    // LLM으로 건강 정보 추출
    const profile = await llmService.extractHealthProfile(pdfText);

    // DB에 저장
    const result = prepare(`
      INSERT INTO health_profiles (user_id, profile_data, pdf_filename)
      VALUES (?, ?, ?)
    `).run(userId, JSON.stringify(profile), req.file.originalname);

    // 업로드 파일 정리
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      profileId: result.lastInsertRowid,
      profile
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// 건강 점수 계산
router.get('/score', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const today = new Date().toISOString().split('T')[0];

    // 건강 프로필
    const profileRow = prepare(`
      SELECT profile_data FROM health_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(userId);
    const healthProfile = profileRow ? JSON.parse(profileRow.profile_data) : null;

    // 오늘의 이벤트
    const todayEvents = prepare(`
      SELECT * FROM timeline_events WHERE user_id = ? AND event_date = ?
    `).all(userId, today);

    // 최근 요약
    const recentSummaries = prepare(`
      SELECT ss.summary, ss.category
      FROM session_summaries ss
      JOIN chat_sessions cs ON ss.session_id = cs.id
      WHERE cs.user_id = ?
      ORDER BY cs.session_date DESC
      LIMIT 5
    `).all(userId);

    // LLM으로 점수 계산
    const scoreData = await llmService.calculateHealthScore({
      healthProfile,
      todayEvents,
      recentSummaries: recentSummaries.map(s => `${s.category}: ${s.summary}`)
    });

    // 일일 기록에 저장
    prepare(`
      INSERT OR REPLACE INTO daily_diary (user_id, diary_date, content, health_score)
      VALUES (?, ?, ?, ?)
    `).run(userId, today, JSON.stringify(scoreData), scoreData.score);

    res.json(scoreData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 타임라인 이벤트 조회
router.get('/timeline/:date?', (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const date = req.params.date || new Date().toISOString().split('T')[0];

    const events = prepare(`
      SELECT * FROM timeline_events
      WHERE user_id = ? AND event_date = ?
      ORDER BY event_time
    `).all(userId, date);

    res.json({ events, date });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 타임라인 이벤트 수동 추가
router.post('/timeline', (req, res) => {
  try {
    const { userId = 'default', date, time, type, title, description, metadata } = req.body;

    const result = prepare(`
      INSERT INTO timeline_events (user_id, event_date, event_time, event_type, title, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, date, time, type, title, description, metadata ? JSON.stringify(metadata) : null);

    res.json({ success: true, eventId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 월간 캘린더 데이터
router.get('/calendar/:year/:month', (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const { year, month } = req.params;

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    // 해당 월의 세션 및 이벤트 조회
    const sessions = prepare(`
      SELECT cs.session_date, COUNT(cm.id) as message_count
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE cs.user_id = ? AND cs.session_date BETWEEN ? AND ?
      GROUP BY cs.session_date
    `).all(userId, startDate, endDate);

    const events = prepare(`
      SELECT event_date, event_type, COUNT(*) as count
      FROM timeline_events
      WHERE user_id = ? AND event_date BETWEEN ? AND ?
      GROUP BY event_date, event_type
    `).all(userId, startDate, endDate);

    const scores = prepare(`
      SELECT diary_date as date, health_score
      FROM daily_diary
      WHERE user_id = ? AND diary_date BETWEEN ? AND ?
    `).all(userId, startDate, endDate);

    res.json({ sessions, events, scores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
