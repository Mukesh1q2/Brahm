import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/app/_lib/prisma";

const PERSIST_ENABLED = (process.env.NEXT_PUBLIC_PERSIST_REMOTE ?? "false") !== "false";
const DB_ENABLED = !!process.env.DATABASE_URL && !!process.env.DATABASE_PROVIDER;

// In-memory fallback for dev (shared across modules via globalThis to survive HMR)
const gMem: any = (globalThis as any);
if (!gMem.__brahm_dev_mem__) gMem.__brahm_dev_mem__ = { conversations: [] as any[], messages: [] as any[] };
const memory = gMem.__brahm_dev_mem__;

function getUserId(req: NextRequest): string {
  try {
    const auth = req.headers.get('authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return `dev-${m[1].slice(0,8)}`;
  } catch {}
  return 'dev-user';
}

export async function GET(req: NextRequest) {
  if (!PERSIST_ENABLED) return NextResponse.json({ error: "disabled" }, { status: 404 });
  const userId = getUserId(req);
  const { searchParams } = new URL(req.url);
  const convId = String(searchParams.get("conversationId") || "");
  const since = Number(searchParams.get("since") || "0");
  if (!convId) return NextResponse.json({ items: [] });

  if (DB_ENABLED) {
    try {
      const prisma = getPrisma();
      const items = await prisma.message.findMany({
        where: { conversationId: convId, conversation: { userId }, ...(since ? { updatedAt: { gt: new Date(since) } } : {}) },
        orderBy: { updatedAt: "asc" },
        take: 500,
      });
      return NextResponse.json({ items });
    } catch {}
  }
  const items = memory.messages
    .filter((m) => m.conversationId === convId && (!since || new Date(m.updatedAt).getTime() > since) && m.userId === userId)
    .slice(0, 500);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!PERSIST_ENABLED) return NextResponse.json({ error: "disabled" }, { status: 404 });
  const userId = getUserId(req);
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const payload = {
    id: String(body.id || crypto.randomUUID()),
    conversationId: String(body.conversationId),
    userId,
    role: String(body.role || "user"),
    content: String(body.content || ""),
    meta: body.meta ?? null,
    createdAt: body.createdAt ? new Date(body.createdAt).toISOString() : now,
    updatedAt: now,
  };
  if (!payload.conversationId) return NextResponse.json({ detail: "invalid" }, { status: 400 });

  if (DB_ENABLED) {
    try {
      const prisma = getPrisma();
      const item = await prisma.message.upsert({
        where: { id: payload.id },
        update: { role: payload.role, content: payload.content, meta: payload.meta, updatedAt: new Date(now) },
        create: { id: payload.id, conversationId: payload.conversationId, role: payload.role, content: payload.content, meta: payload.meta, createdAt: new Date(payload.createdAt), updatedAt: new Date(now) },
      });
      return NextResponse.json({ ok: true, item });
    } catch {}
  }
  const idx = memory.messages.findIndex((m) => m.id === payload.id && m.userId === userId);
  if (idx >= 0) memory.messages[idx] = { ...memory.messages[idx], ...payload };
  else memory.messages.push(payload);
  // Also mirror an episode into the Conscious memory store for dev parity
  try {
    const { getMemory } = await import('@/lib/conscious/memorySingleton');
    await getMemory().storeEpisode({ id: payload.id, experience: { timestamp: Date.parse(payload.updatedAt), main_content: payload.content, phi_level: 0 } });
  } catch {}
  return NextResponse.json({ ok: true, item: payload });
}

