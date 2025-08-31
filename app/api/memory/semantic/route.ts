import { NextRequest, NextResponse } from 'next/server';
import { insertSemanticSafe } from '@/app/api/_lib/pg';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const ok = await insertSemanticSafe({ text: String(body?.text||''), labels: Array.isArray(body?.labels)? body.labels: [], ts: Number(body?.ts||Date.now()) });
    if (!ok) return NextResponse.json({ ok: false, error: 'db_unavailable' }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}

