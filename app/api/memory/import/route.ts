import { NextResponse } from 'next/server';
import { insertDiarySafe, insertSemanticSafe, insertEpisodeSafe } from '../../_lib/pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const diary = Array.isArray(body?.diary) ? body.diary : [];
    const semantic = Array.isArray(body?.semantic) ? body.semantic : [];
    const episodes = Array.isArray(body?.episodes) ? body.episodes : [];
    let diary_ok = 0, sem_ok = 0, epi_ok = 0;
    for (const d of diary) {
      if (await insertDiarySafe(d)) diary_ok++;
    }
    for (const s of semantic) {
      if (await insertSemanticSafe(s)) sem_ok++;
    }
    for (const e of episodes) {
      if (await insertEpisodeSafe(e)) epi_ok++;
    }
    return NextResponse.json({ ok: true, imported: { diary: diary_ok, semantic: sem_ok, episodes: epi_ok } });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

