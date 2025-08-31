export function getMindBase(): string {
  const base = process.env.MIND_BASE_URL || process.env.NEXT_PUBLIC_MIND_BASE_URL || "http://localhost:7071";
  return base.replace(/\/$/, "");
}

function filterRequestHeaders(req: Request): Headers {
  const out = new Headers();
  req.headers.forEach((v, k) => {
    const kl = k.toLowerCase();
    if (["host", "connection", "content-length", "accept-encoding"].includes(kl)) return;
    out.set(k, v);
  });
  // Identify this proxy
  out.set("x-proxy", "brahm-next");
  return out;
}

export async function proxyRequest(req: Request, subpath: string): Promise<Response> {
  const base = getMindBase();
  const urlIn = new URL(req.url);
  const targetUrl = `${base}${subpath}${urlIn.search || ""}`;
  const method = req.method?.toUpperCase() || "GET";

  let body: BodyInit | undefined = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    // Preserve raw body (supports JSON and formdata)
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? buf : undefined;
  }

  const res = await fetch(targetUrl, {
    method,
    headers: filterRequestHeaders(req),
    body,
    // Important for dev proxies
    redirect: "manual",
  });

  // Pass through response headers (avoid hop-by-hop)
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    const kl = k.toLowerCase();
    if (["transfer-encoding", "content-encoding"].includes(kl)) return;
    headers.set(k, v);
  });
  headers.set("x-proxy", "brahm-next");

  // Stream body if available
  if (res.body) {
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
  const text = await res.text().catch(() => "");
  return new Response(text, { status: res.status, statusText: res.statusText, headers });
}

