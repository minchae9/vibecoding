import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ items: [] })

  const res = await fetch(
    `https://naveropenapi.apigw.ntruss.com/map-place/v1/search?query=${encodeURIComponent(query)}&language=ko`,
    {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID!,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET!,
      },
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ items: [], error: err }, { status: res.status })
  }

  const data = await res.json()

  // NCP Place API 응답을 기존 형식에 맞게 변환
  const items = (data.places || []).map((p: any) => ({
    title: p.name,
    address: p.address,
    roadAddress: p.roadAddress,
    mapx: String(Math.round(parseFloat(p.x) * 1e7)),
    mapy: String(Math.round(parseFloat(p.y) * 1e7)),
    category: p.category,
  }))

  return NextResponse.json({ items })
}
