import { proxyRequest } from "../../_lib/proxy";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return proxyRequest(req, "/consciousness/neuromorphic");
}

