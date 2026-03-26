import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    const db = await getDb();

    const profile = await db.get(
      'SELECT * FROM health_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        ...JSON.parse(profile.profile_data),
        id: profile.id,
        extractedAt: profile.extracted_at,
        pdfFilename: profile.pdf_filename
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
