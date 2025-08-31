import { proxyRequest } from "@/app/api/_lib/proxy";
import { searchSemanticText } from "@/app/api/_lib/pg";
import { parseNumber, parseLabelsFromParams } from "@/app/api/_lib/validate";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;
    const q = (sp.get('q') || '').trim();
    const top = parseNumber(sp.get('top')) ?? 10;
    const labels = parseLabelsFromParams(sp) ?? [];
    if (q) {
      const items = await searchSemanticText(q, top, labels.length?labels:undefined);
      if (Array.isArray(items)) {
        return new Response(JSON.stringify({ items }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    }
  } catch {}
  // forward query params to Mind stub otherwise
  return proxyRequest(req, "/memory/search");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const q = String(body?.q || body?.query || '').trim();
    const topRaw = body?.top; const top = Number.isFinite(topRaw) ? Number(topRaw) : 10;
    const labels = Array.isArray(body?.labels) ? body.labels : [];
    if (q) {
      const items = await searchSemanticText(q, top || 10, labels.length?labels:undefined);
      if (Array.isArray(items)) {
        return new Response(JSON.stringify({ items }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    }
  } catch {}
  return proxyRequest(req, "/memory/search");
}

