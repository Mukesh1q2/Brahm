import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test-mode override: allow disabling DB availability for E2E stability
    const e2eOff = (process.env.BRAHM_E2E_DISABLE_DB === 'true') || (process.env.NEXT_PUBLIC_E2E_DISABLE_DB === 'true');
    if (e2eOff) return NextResponse.json({ ok: false, reason: 'e2e-disabled' });
    const { isPgAvailable } = await import("../../_lib/pg");
    const ok = await isPgAvailable();
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
