import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = sp.get('q') || ''
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 })
  const items = Array.from({ length: 2 }).map((_,i)=> ({ id: `arxiv_${i}`, title: `${q} — Paper ${i+1}`, authors: ['A','B'], link: `https://arxiv.org/abs/1234.${1000+i}`, ts: new Date(Date.now()-i*86400_000).toISOString() }))
  return NextResponse.json({ total: items.length, items })
}

