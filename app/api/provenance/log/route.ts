import { NextRequest, NextResponse } from 'next/server'

type ProvEvent = { id: string; ts: string; actor?: string; action: string; target?: string; meta?: any }

const g: any = globalThis as any
if (!g.__prov__) g.__prov__ = [] as ProvEvent[]

export async function GET() {
  return NextResponse.json({ total: (g.__prov__ as ProvEvent[]).length, items: [...g.__prov__].reverse() })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}))
    const item: ProvEvent = { id: body.id||crypto.randomUUID(), ts: new Date().toISOString(), actor: body.actor||'dev', action: String(body.action||'log'), target: body.target, meta: body.meta }
    g.__prov__.push(item)
    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

