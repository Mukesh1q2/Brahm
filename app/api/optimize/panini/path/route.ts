import { NextRequest, NextResponse } from 'next/server';
import { shortestPath } from '@/lib/paniniStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const start = String(body.start || '').trim();
    const goal = String(body.goal || '').trim();
    if (!start || !goal) return NextResponse.json({ detail: 'start, goal required' }, { status: 400 });
    const default_weight = Number(body.default_weight || 1);
    const rel_allow = Array.isArray(body.rel_allow) ? body.rel_allow.map((s:any)=>String(s)) : undefined;
    const fields = Array.isArray(body.fields) ? body.fields.map((s:any)=>String(s)) : undefined;
    const algorithm = (body.algorithm === 'astar') ? 'astar' : 'dijkstra';
    const heuristic = ['zero','levenshtein','dotpath'].includes(String(body.heuristic)) ? String(body.heuristic) as any : 'zero';
    const res = shortestPath(start, goal, { defaultWeight: default_weight, relAllow: rel_allow, fields, algorithm, heuristic });
    if (!res) return NextResponse.json({ detail: 'no path' }, { status: 404 });
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'bad request' }, { status: 400 });
  }
}

