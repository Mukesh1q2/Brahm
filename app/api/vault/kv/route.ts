import { NextResponse } from 'next/server'
import { vaultRead, vaultWrite } from '../../_utils/vault'

function devGuard() {
  const dev = process.env.NODE_ENV !== 'production' || (process.env.VAULT_DEMO === 'true');
  if (!dev) throw new Error('Vault demo route disabled in production');
}

export async function GET(req: Request) {
  try {
    devGuard();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || '';
    if (!key) return NextResponse.json({ ok: false, error: 'missing key' }, { status: 400 });
    const value = await vaultRead(key);
    return NextResponse.json({ ok: true, key, value });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    devGuard();
    const body = await req.json().catch(()=>({}));
    const key = String(body.key || '');
    const value = String(body.value || '');
    if (!key) return NextResponse.json({ ok: false, error: 'missing key' }, { status: 400 });
    const ok = await vaultWrite(key, value);
    return NextResponse.json({ ok, key });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

