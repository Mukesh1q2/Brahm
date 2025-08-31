import { NextRequest, NextResponse } from 'next/server'
import { insertConsciousnessStateSafe, listConsciousnessStates } from '../../_lib/pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 100)))
    const items = await listConsciousnessStates(limit)
    return NextResponse.json({ items })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}))
    const ok = await insertConsciousnessStateSafe({
      phi_level: Number(body?.phi_level||body?.phi||0),
      valence: body?.valence!=null ? Number(body.valence) : null,
      coherence: body?.coherence!=null ? Number(body.coherence) : null,
      session_id: body?.session_id!=null ? String(body.session_id) : null,
      raw_metrics: body?.raw_metrics ?? null,
    })
    if (!ok) return NextResponse.json({ ok: false, error: 'insert failed' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

