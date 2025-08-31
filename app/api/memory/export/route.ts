import { NextResponse } from 'next/server';
import { listDiary, listSemantic, listEpisodes } from '../../_lib/pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const diary = await listDiary(2000);
    const semantic = await listSemantic(5000);
    const episodes = await listEpisodes({ limit: 2000 });
    return NextResponse.json({ ok: true, diary, semantic, episodes });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

