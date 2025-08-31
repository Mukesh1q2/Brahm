import { NextRequest, NextResponse } from 'next/server';
import { addReplay, latestReplay } from '@/lib/replayStore';
import type { ReplayBatch, ReplayEvent } from '@/types/replay';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.max(1, Math.min(1000, Number(limitParam || 100)));
    const data = latestReplay(limit);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const now = Date.now();

    if (Array.isArray(json?.events)) {
      const events: ReplayEvent[] = (json as ReplayBatch).events.map((e) => ({ ts: e.ts || now, kind: String(e.kind||'misc'), page: e.page, section: e.section ?? null, app: e.app, user: e.user ?? null, metadata: e.metadata || {} }));
      addReplay(events);
      return NextResponse.json({ ok: true, added: events.length }, { status: 200 });
    }

    if (json && typeof json === 'object') {
      const e = json as ReplayEvent;
      const ev: ReplayEvent = { ts: e.ts || now, kind: String(e.kind||'misc'), page: e.page, section: e.section ?? null, app: e.app, user: e.user ?? null, metadata: e.metadata || {} };
      addReplay(ev);
      return NextResponse.json({ ok: true, added: 1 }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

