import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/app/_lib/prisma";

const DB_ENABLED = !!process.env.DATABASE_URL && !!process.env.DATABASE_PROVIDER;

function getUserId(req: NextRequest): string {
  try {
    const auth = req.headers.get('authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return `dev-${m[1].slice(0,8)}`;
  } catch {}
  return 'dev-user';
}

export async function GET(req: NextRequest) {
  if (!DB_ENABLED) {
    // Fallback to in-memory experiences
    try {
      const { getMemory } = await import('@/lib/conscious/memorySingleton');
      const sp = req.nextUrl.searchParams;
      const q = sp.get('q') || '';
      const since = sp.get('since') ? Number(sp.get('since')) : undefined;
      const limit = sp.get('limit') ? Number(sp.get('limit')) : 50;
      const eps = await getMemory().retrieveEpisodes({ q, since, limit });
      return NextResponse.json({ items: eps });
    } catch (e: any) {
      return NextResponse.json({ detail: e?.message || 'mem error' }, { status: 500 });
    }
  }
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(req.url);
    const userId = getUserId(req);
    const since = Number(searchParams.get('since') || '0');
    const limit = Number(searchParams.get('limit') || '50');
    const items = await prisma.experience.findMany({
      where: { userId, ...(since ? { timestamp: { gt: new Date(since) } } : {}) },
      orderBy: { timestamp: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'db error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!DB_ENABLED) return NextResponse.json({ error: 'db disabled' }, { status: 404 });
  try {
    const prisma = getPrisma();
    const userId = getUserId(req);
    const body = await req.json().catch(()=>({}));
    const payload = {
      id: String(body.id || crypto.randomUUID()),
      userId,
      timestamp: new Date(body.timestamp || Date.now()),
      main_content: String(body.main_content || ''),
      phi_level: Number(body.phi_level ?? 0),
      qualia_count: Number(body.qualia_count ?? 0),
      duration_ms: Number(body.duration_ms ?? 0),
    } as const;
    const item = await prisma.experience.upsert({
      where: { id: payload.id },
      update: { ...payload },
      create: { ...payload },
    });
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'db error' }, { status: 500 });
  }
}

