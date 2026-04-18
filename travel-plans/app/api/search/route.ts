import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ items: [] })

  const res = await fetch(
    `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
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

  const items = (data.addresses || []).map((a: any) => ({
    title: a.roadAddress || a.jibunAddress,
    address: a.jibunAddress,
    roadAddress: a.roadAddress,
    // geocoding returns x=lng, y=lat as strings
    x: a.x,
    y: a.y,
    category: '',
  }))

  return NextResponse.json({ items })
}
