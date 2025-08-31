import { NextResponse } from 'next/server';
import { cleanupTable } from '../../_lib/pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const table = body?.table === 'diary' ? 'diary' : 'semantic';
    const older = Number(body?.olderThanDays || 0) || 0;
    const keep = Number(body?.keepLatest || 0) || 0;
    const res = await cleanupTable({ table, olderThanDays: older, keepLatest: keep });
    return NextResponse.json({ ok: true, ...res });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
