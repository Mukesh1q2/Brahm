import { NextRequest, NextResponse } from 'next/server'

let CANARY = (process.env.NEXT_PUBLIC_CANARY ?? 'false') !== 'false'

function devGuard() {
  const dev = process.env.NODE_ENV !== 'production' || (process.env.CANARY_DEMO === 'true')
  if (!dev) throw new Error('Canary toggle disabled in production')
}

export async function GET() {
  return NextResponse.json({ canary: CANARY })
}

export async function POST(req: NextRequest) {
  try {
    devGuard()
    const body = await req.json().catch(()=>({}))
    if (typeof body.canary === 'boolean') CANARY = body.canary
    return NextResponse.json({ ok: true, canary: CANARY })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

