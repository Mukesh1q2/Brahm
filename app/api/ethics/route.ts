import { proxyRequest } from "../_lib/proxy";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Evaluate or fetch latest ethics decision if implemented upstream
  return proxyRequest(req, "/ethics/evaluate");
}

export async function POST(req: Request) {
  return proxyRequest(req, "/ethics/evaluate");
}

