import { NextResponse } from "next/server";
import { bootstrapPgSafe } from "../../_lib/pg";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const ok = await bootstrapPgSafe();
    if (!ok) return NextResponse.json({ ok: false, error: "PG not configured" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

