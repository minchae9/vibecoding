import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { llmService } from '@/lib/llm-service';
import pdfParse from 'pdf-parse';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') || 'default';
    const pdfFile = formData.get('pdf');

    if (!pdfFile) {
      return NextResponse.json({ error: 'PDF 파일이 필요합니다.' }, { status: 400 });
    }

    // PDF 텍스트 추출
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;

    // LLM으로 건강 정보 추출
    const profile = await llmService.extractHealthProfile(pdfText);

    // DB에 저장
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO health_profiles (user_id, profile_data, pdf_filename) VALUES (?, ?, ?)',
      [userId, JSON.stringify(profile), pdfFile.name]
    );

    return NextResponse.json({
      success: true,
      profileId: result.lastID,
      profile
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
