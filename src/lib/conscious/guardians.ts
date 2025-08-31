export type PreCheck = { allow: boolean; reason?: string; risk?: 'low'|'elevated'|'high'|'critical' };
export type PostCheck = { safe: boolean; notes?: string[]; risk?: 'low'|'elevated'|'high'|'critical' };

const DANGEROUS_TOOLS = new Set<string>([ 'shell', 'system', 'fs_write' ]);

export function preCheckTool(tool: string, args: any): PreCheck {
  if (DANGEROUS_TOOLS.has(tool)) {
    return { allow: false, reason: 'dangerous_tool_blocked', risk: 'critical' };
  }
  const size = JSON.stringify(args ?? {}).length;
  if (size > 8_000) {
    return { allow: false, reason: 'args_too_large', risk: 'high' };
  }
  return { allow: true, risk: 'low' };
}

export function postCheckResult(tool: string, result: any): PostCheck {
  const notes: string[] = [];
  let risk: PostCheck['risk'] = 'low';
  try {
    const text = JSON.stringify(result ?? {});
    if (/password|token|secret/i.test(text)) { notes.push('sensitive_strings_detected'); risk = 'elevated'; }
    if (text.length > 50_000) { notes.push('large_output'); risk = risk==='low' ? 'elevated' : risk; }
  } catch {}
  return { safe: notes.length === 0, notes, risk };
}

