import { neon } from '@neondatabase/serverless';

let initialized = false;

async function initDatabase() {
  if (initialized) return;

  try {
    // 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS health_profiles (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        profile_data JSONB NOT NULL,
        extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        pdf_filename TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        session_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, session_date)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES chat_sessions(id),
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS session_summaries (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES chat_sessions(id),
        time_block TEXT NOT NULL,
        category TEXT CHECK(category IN ('activity', 'intake', 'mood', 'general')),
        summary TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS daily_diary (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        diary_date DATE NOT NULL,
        content TEXT NOT NULL,
        health_score REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, diary_date)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        event_date DATE NOT NULL,
        event_time TIME NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('meal', 'activity', 'status', 'other')),
        title TEXT NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    initialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database init error:', error);
    // 테이블이 이미 존재하는 경우 등 무시
    initialized = true;
  }
}

// 쿼리 헬퍼
export async function getDb() {
  await initDatabase();
  return {
    get: async (query, params = []) => {
      const result = await sql.query(query, params);
      return result.rows[0] || null;
    },
    all: async (query, params = []) => {
      const result = await sql.query(query, params);
      return result.rows;
    },
    run: async (query, params = []) => {
      const result = await sql.query(query + ' RETURNING id', params);
      return { lastID: result.rows[0]?.id, changes: result.rowCount };
    }
  };
}

export { initDatabase };
