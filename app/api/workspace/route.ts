import { proxyRequest } from "../_lib/proxy";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Forward GET to /workspace/act (use query params as-is)
  return proxyRequest(req, "/workspace/act");
}

export async function POST(req: Request) {
  return proxyRequest(req, "/workspace/act");
}

