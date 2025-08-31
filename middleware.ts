import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  // only protect certain API namespaces for now
  const protectedPrefixes = [
    "/api/tools",
    "/api/rpc",
  ];
  const requiresAuth = protectedPrefixes.some(p => path.startsWith(p));

  // Simple rate limiting by IP per minute, in-memory
  const ip = (req.headers.get("x-forwarded-for") || req.ip || "anon").split(",")[0].trim();
  const key = `rl:${ip}:${new Date().getUTCFullYear()}-${new Date().getUTCMonth()}-${new Date().getUTCDate()}-${new Date().getUTCHours()}-${new Date().getUTCMinutes()}`;
  // @ts-ignore
  global.__rate__ = global.__rate__ || new Map<string, number>();
  // @ts-ignore
  const map: Map<string, number> = global.__rate__;
  const count = (map.get(key) || 0) + 1;
  map.set(key, count);
  const limit = 200; // per minute
  if (count > limit) {
    const res = new NextResponse(JSON.stringify({ detail: "rate limit exceeded" }), { status: 429 });
    res.headers.set("x-rate-limit", String(limit));
    res.headers.set("x-rate-remaining", "0");
    return res;
  }

  // Propagate edition to API handlers via request header (cookie/header/env)
  // Applies to all /api/* routes for consistency.
  const requestHeaders = new Headers(req.headers);
  let edition = (requestHeaders.get('x-brahm-edition') || '').toLowerCase();
  if (edition !== 'basic' && edition !== 'advanced') {
    const cookieEd = (req.cookies.get('brahm_edition')?.value || '').toLowerCase();
    if (cookieEd === 'basic' || cookieEd === 'advanced') {
      edition = cookieEd;
    } else {
      const envEd = (process.env.BRAHM_EDITION || process.env.NEXT_PUBLIC_BRAHM_EDITION || 'basic').toLowerCase();
      edition = envEd === 'advanced' ? 'advanced' : 'basic';
    }
  }
  requestHeaders.set('x-brahm-edition', edition);

  if (!requiresAuth) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set("x-rate-limit", String(limit));
    res.headers.set("x-rate-remaining", String(Math.max(0, limit - count)));
    return res;
  }

  const auth = req.headers.get("authorization") || "";
  const ok = auth.startsWith("Bearer ") && auth.slice(7).length > 0;
  if (!ok) {
    const res = new NextResponse(JSON.stringify({ detail: "missing or invalid token" }), { status: 401 });
    res.headers.set("x-rate-limit", String(limit));
    res.headers.set("x-rate-remaining", String(Math.max(0, limit - count)));
    return res;
  }
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("x-rate-limit", String(limit));
  res.headers.set("x-rate-remaining", String(Math.max(0, limit - count)));
  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};

