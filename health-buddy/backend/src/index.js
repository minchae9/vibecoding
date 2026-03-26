import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// 환경 변수 로드
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// DB 초기화 후 라우트 로드
let chatRoutes, healthRoutes;

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 비동기 초기화
async function startServer() {
  // DB 모듈 초기화
  const db = await import('./database.js');
  await db.initDatabase();

  // 라우트 로드
  const chatModule = await import('./routes/chat.js');
  const healthModule = await import('./routes/health.js');
  chatRoutes = chatModule.default;
  healthRoutes = healthModule.default;

  // 라우트 등록
  app.use('/api/chat', chatRoutes);
  app.use('/api/health', healthRoutes);

  // 헬스 체크
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 에러 핸들링
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || '서버 오류가 발생했습니다.' });
  });

  app.listen(PORT, () => {
    console.log(`🏥 Health Buddy Backend running on http://localhost:${PORT}`);
    console.log(`📚 API Endpoints:`);
    console.log(`   POST /api/chat/message - 채팅 메시지`);
    console.log(`   GET  /api/chat/session/:date - 세션 기록`);
    console.log(`   POST /api/chat/summarize - 대화 요약`);
    console.log(`   GET  /api/health/profile - 건강 프로필`);
    console.log(`   POST /api/health/upload-pdf - PDF 업로드`);
    console.log(`   GET  /api/health/score - 건강 점수`);
    console.log(`   GET  /api/health/timeline/:date - 타임라인`);
    console.log(`   GET  /api/health/calendar/:year/:month - 캘린더 데이터`);
  });
}

startServer().catch(console.error);
