import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ items: [] })

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10&start=1&sort=random`,
    {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
      },
    }
  )

  if (!res.ok) return NextResponse.json({ items: [] }, { status: res.status })
  const data = await res.json()
  return NextResponse.json(data)
}
