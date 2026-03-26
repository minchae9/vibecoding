# Health Buddy 🏥

AI 기반 건강 의사결정 지원 서비스

## 기술 스택

- **Frontend**: Next.js 14 + React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **AI**: Claude API (z.ai)

## 프로젝트 구조

```
health-buddy/
├── backend/
│   ├── src/
│   │   ├── index.js          # 서버 진입점
│   │   ├── database.js       # DB 스키마 및 초기화
│   │   ├── llm.js            # 스키마 정의
│   │   ├── llm-service.js    # Claude API 서비스
│   │   └── routes/
│   │       ├── chat.js       # 채팅 API
│   │       └── health.js     # 건강 데이터 API
│   ├── .env                  # 환경 변수 (git 제외)
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.js       # 메인 페이지
│   │       ├── layout.js     # 레이아웃
│   │       └── globals.css   # 글로벌 스타일
│   └── package.json
└── README.md
```

## 주요 기능

### 1. PDF 건강검진 분석
- 건강검진 결과 PDF 업로드
- LLM을 통한 정형화된 JSON 추출
- 사용자 건강 프로필 저장

### 2. 컨텍스트 관리
- 날짜별 대화 세션 관리
- 2시간 단위 대화 요약 (활동/섭취/기분 카테고리)
- Hybrid Retrieval: 프로필 + 요약 + 현재 세션 조합

### 3. 대시보드
- 캘린더 기반 일별 기록 조회
- 타임라인 (식사, 활동, 상태)
- TMI/일기 영역
- Health Suitability Scale (그라데이션 프로필 바)

### 4. 영구 채팅
- 페이지 이동 시에도 세션 유지
- 재접속 시 당일 대화 기록 자동 로드

## 시작하기

### Backend 실행

```bash
cd backend
npm install
npm run dev
```

### Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

### 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## DB 스키마

### health_profiles
건강검진 PDF에서 추출한 프로필 저장

### chat_sessions / chat_messages
날짜별 세션과 메시지 기록

### session_summaries
2시간 단위 요약 (activity, intake, mood, general)

### timeline_events
식사, 활동, 상태 이벤트

### daily_diary
일일 TMI 및 건강 점수

## 환경 변수

Backend `.env`:
```
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
ANTHROPIC_API_KEY=your-api-key
PORT=3001
```

Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API 엔드포인트

### 채팅
- `POST /api/chat/message` - 메시지 전송
- `GET /api/chat/session/:date?` - 세션 기록 조회
- `POST /api/chat/summarize` - 대화 요약

### 건강
- `GET /api/health/profile` - 건강 프로필 조회
- `POST /api/health/upload-pdf` - PDF 업로드
- `GET /api/health/score` - 건강 점수
- `GET /api/health/timeline/:date?` - 타임라인
- `GET /api/health/calendar/:year/:month` - 캘린더 데이터
