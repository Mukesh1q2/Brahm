import { proxyRequest } from "@/app/api/_lib/proxy";
import { listDiary, insertDiarySafe } from "@/app/api/_lib/pg";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // If listing diary and PG is configured, serve from Postgres for persistence-backed view
  try {
    const url = new URL(req.url);
    const list = url.searchParams.get('list');
    if (list === 'diary') {
      const limit = Number(url.searchParams.get('limit') || '100') || 100;
      const items = await listDiary(limit);
      // Always return JSON (empty array when none) to avoid proxy during tests/dev when PG configured or helper available
      if (Array.isArray(items)) {
        return new Response(JSON.stringify({ items }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    }
  } catch {}
  return proxyRequest(req, "/memory");
}

export async function POST(req: Request) {
  // Opportunistically persist to Postgres (server-side) without affecting proxy
  try {
    const clone = req.clone();
    const body = await clone.json().catch(() => null);
    if (body) {
      insertDiarySafe(body).catch(() => {});
    }
  } catch {}
  return proxyRequest(req, "/memory");
}

export async function PUT(req: Request) {
  return proxyRequest(req, "/memory");
}

export async function DELETE(req: Request) {
  return proxyRequest(req, "/memory");
}

