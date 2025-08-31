import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeEdition(val: unknown): 'basic' | 'advanced' {
  const s = String(val || '').toLowerCase();
  return s === 'advanced' ? 'advanced' : 'basic';
}

export async function GET(req: Request) {
  try {
    // @ts-ignore - Next.js Request in route handlers has cookies in headers; read via request headers
    const cookieHeader: string | null = (req.headers.get('cookie') || null);
    const cookieMatch = cookieHeader?.match(/(?:^|;\s*)brahm_edition=([^;]+)/);
    const cookieVal = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
    const envVal = process.env.BRAHM_EDITION || process.env.NEXT_PUBLIC_BRAHM_EDITION || 'basic';
    const edition = normalizeEdition(cookieVal || envVal);
    return NextResponse.json({ edition });
  } catch {
    return NextResponse.json({ edition: 'basic' });
  }
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({} as any));
  const edition = normalizeEdition(json?.edition);
  const res = NextResponse.json({ ok: true, edition });
  res.cookies.set({
    name: 'brahm_edition',
    value: edition,
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

