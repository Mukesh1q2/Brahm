import type { NextRequest } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log('[POLICY_LOG]', body);
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

