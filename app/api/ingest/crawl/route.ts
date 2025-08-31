import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const url = sp.get('url') || ''
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })
  // stub: pretend we fetched
  return NextResponse.json({ title: `Fetched: ${url}`, text: 'Lorem ipsum dolor sit amet...', links: [`${url}#a`, `${url}#b`] })
}

