import { NextRequest, NextResponse } from 'next/server';
import { executeTool } from '@/lib/tools/execute';
import { preCheckTool, postCheckResult } from '@/lib/conscious/guardians';

export async function POST(req: NextRequest) {
  try {
    const serverToken = process.env.TOOL_RUNNER_TOKEN;
    if (serverToken) {
      const provided = req.headers.get('x-tool-runner-token') || '';
      if (provided !== serverToken) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
      }
    }
    const body = await req.json().catch(()=>({}));
    const tool = String(body?.tool || '');
    const args = body?.args ?? {};
    const pre = preCheckTool(tool, args);
    if (!pre.allow) {
      return NextResponse.json({ ok: false, blocked: true, reason: pre.reason, risk: pre.risk }, { status: 400 });
    }
    const exec = await executeTool({ tool, args });
    const post = postCheckResult(tool, exec.result);
    return NextResponse.json({ ...exec, guard: { pre, post } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'execute_error' }, { status: 500 });
  }
}
