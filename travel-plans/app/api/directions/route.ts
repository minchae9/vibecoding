import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const start = searchParams.get('start') // "lng,lat"
  const goal = searchParams.get('goal')
  const mode = searchParams.get('mode') || 'walk'

  if (!start || !goal) return NextResponse.json({ error: 'missing params' }, { status: 400 })

  const headers = {
    'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID!,
    'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET!,
  }

  let url = ''
  if (mode === 'car') {
    url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&option=trafast`
  } else if (mode === 'transit') {
    url = `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/transit?start=${start}&goal=${goal}`
  } else {
    url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`
  }

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
