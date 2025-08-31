import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    // demo: accept anything, return a short-lived token
    const token = `dev_${Math.random().toString(36).slice(2, 10)}`;
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    return NextResponse.json({ access_token: token, token_type: "Bearer", expires_at: expires });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "bad request" }, { status: 400 });
  }
}

