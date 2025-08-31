import { preCheckTool, postCheckResult } from '@/lib/conscious/guardians';
import { executeTool } from '@/lib/tools/execute';
import { EnhancedConsciousToolSystem } from '@/lib/conscious/tools';

describe('Tools executor + guardians', () => {
  test('preCheck blocks dangerous tools', () => {
    const pre = preCheckTool('shell', { cmd: 'rm -rf /' });
    expect(pre.allow).toBe(false);
    expect(pre.risk).toBe('critical');
  });

  test('executeTool echo returns payload', async () => {
    const res = await executeTool({ tool: 'echo', args: { x: 1 } });
    expect(res.ok).toBe(true);
    expect(res.result).toEqual({ echo: { x: 1 } });
  });

  test('postCheck flags sensitive strings', () => {
    const post = postCheckResult('echo', { token: 'abc' });
    expect(post.safe).toBe(false);
    expect(post.notes).toContain('sensitive_strings_detected');
  });

  test('EnhancedConsciousToolSystem attaches guard + impact', async () => {
    const sys = new EnhancedConsciousToolSystem();
    const result: any = await sys.executeConsciously(
      { tool: 'echo', args: { msg: 'hi' } },
      { att: { focused_content: 'x', attention_strength: 0.6, focus_duration_ms: 120, peripheral_awareness: [], attention_switching_cost: 0.3, binding_coherence: 0.5 },
        phi: { phi_value: 4, components: { information:0.5, integration:0.5, exclusion:0.5, intrinsic_existence:0.5, unification:0.5}, method: 'heuristic', confidence: 0.7 } }
    );
    expect(result.ok).toBe(true);
    expect(result.guard?.pre).toBeTruthy();
    expect(result.guard?.post).toBeTruthy();
    expect(typeof result.consciousness_impact?.phi_change).toBe('number');
  });
});

