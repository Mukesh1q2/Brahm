import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const prompt = String(body.prompt || '')
  if (!prompt) return NextResponse.json({ error: 'missing prompt' }, { status: 400 })
  // 1x1 PNG black pixel
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAt8B9y4R6nQAAAAASUVORK5CYII='
  return NextResponse.json({ image: `data:image/png;base64,${base64}`, prompt })
}

