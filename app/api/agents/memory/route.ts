import { NextRequest, NextResponse } from "next/server";
import { getMemory } from "@/lib/conscious/memorySingleton";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const mem = getMemory();
    const sp = req.nextUrl.searchParams;
    const query = {
      q: sp.get('q') || '',
      since: sp.get('since') ? Number(sp.get('since')) : undefined,
      phi_min: sp.get('phi_min') ? Number(sp.get('phi_min')) : undefined,
      phi_max: sp.get('phi_max') ? Number(sp.get('phi_max')) : undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
    };
    const eps = await mem.retrieveEpisodes(query);
    return NextResponse.json({ episodes: eps });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "memory error" }, { status: 500 });
  }
}
