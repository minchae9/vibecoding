import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ items: [] })

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10&sort=random`,
    {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_SEARCH_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_SEARCH_CLIENT_SECRET!,
      },
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ items: [], error: err }, { status: res.status })
  }

  const data = await res.json()

  const items = (data.items || []).map((item: any) => ({
    title: item.title.replace(/<[^>]+>/g, ''),
    address: item.address,
    roadAddress: item.roadAddress,
    // Naver local search returns KATECH coords (multiply by 1e-7 to get decimal)
    x: String(parseInt(item.mapx) / 1e7),  // longitude
    y: String(parseInt(item.mapy) / 1e7),  // latitude
    category: item.category,
  }))

  return NextResponse.json({ items })
}
