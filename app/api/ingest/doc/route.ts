import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const text = String(body.text || '')
  if (!text) return NextResponse.json({ error: 'missing text' }, { status: 400 })
  const tokens = text.split(/\s+/).filter(Boolean)
  const top = tokens.slice(0, 10)
  return NextResponse.json({ tokens: tokens.length, preview: top })
}

