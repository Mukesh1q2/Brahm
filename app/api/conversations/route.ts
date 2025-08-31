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
  const since = Number(searchParams.get("since") || "0");

  if (DB_ENABLED) {
    try {
      const prisma = getPrisma();
      const items = await prisma.conversation.findMany({
        where: { userId, ...(since ? { updatedAt: { gt: new Date(since) } } : {}) },
        orderBy: { updatedAt: "desc" },
        take: 200,
      });
      return NextResponse.json({ items });
    } catch {}
  }
  const items = memory.conversations
    .filter((c) => c.userId === userId && (!since || new Date(c.updatedAt).getTime() > since))
    .slice(0, 200);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!PERSIST_ENABLED) return NextResponse.json({ error: "disabled" }, { status: 404 });
  const userId = getUserId(req);
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const payload = {
    id: String(body.id || crypto.randomUUID()),
    userId,
    title: String(body.title || "Untitled"),
    createdAt: body.createdAt ? new Date(body.createdAt).toISOString() : now,
    updatedAt: now,
  };

  if (DB_ENABLED) {
    try {
      const prisma = getPrisma();
      const item = await prisma.conversation.upsert({
        where: { id: payload.id },
        update: { title: payload.title, userId, updatedAt: new Date(now) },
        create: { id: payload.id, title: payload.title, userId, createdAt: new Date(payload.createdAt), updatedAt: new Date(now) },
      });
      return NextResponse.json({ ok: true, item });
    } catch {}
  }
  const idx = memory.conversations.findIndex((c) => c.id === payload.id && c.userId === userId);
  if (idx >= 0) memory.conversations[idx] = { ...memory.conversations[idx], ...payload };
  else memory.conversations.push(payload);
  return NextResponse.json({ ok: true, item: payload });
}

