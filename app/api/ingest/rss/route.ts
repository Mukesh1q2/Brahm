import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const feed = sp.get('url') || ''
  if (!feed) return NextResponse.json({ error: 'missing url' }, { status: 400 })
  const items = Array.from({ length: 3 }).map((_,i)=> ({ id: `rss_${i}`, title: `Item ${i+1}`, link: `${feed}#${i}`, ts: new Date(Date.now()-i*3600_000).toISOString() }))
  return NextResponse.json({ total: items.length, items })
}

