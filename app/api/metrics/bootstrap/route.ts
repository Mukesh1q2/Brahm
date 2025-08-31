import { proxyRequest } from "../../_lib/proxy";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return proxyRequest(req, "/metrics/bootstrap-clickhouse");
}

