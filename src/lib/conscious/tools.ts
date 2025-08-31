import type { AttentionState, PhiMeasurement } from '@/types/Conscious';
import { preCheckTool, postCheckResult } from './guardians';
import { executeTool } from '@/lib/tools/execute';

export interface ConsciousToolSystem {
  executeConsciously(call: { tool: string; args: any; rationale?: string }, consciousness: { att: AttentionState; phi: PhiMeasurement }): Promise<any>
}

export class NoopConsciousToolSystem implements ConsciousToolSystem {
  async executeConsciously(call: any, consciousness: any) {
    return { ok: true, call, consciousness_impact: { phi_change: 0.1 }, experiential_quality: { phenomenal_richness: 0.2 } }
  }
}

export class EnhancedConsciousToolSystem implements ConsciousToolSystem {
  async executeConsciously(call: any, consciousness: { att: AttentionState; phi: PhiMeasurement }) {
    const start = Date.now();
    // Pre-check
    const pre = preCheckTool(String(call?.tool || ''), call?.args);
    if (!pre.allow) {
      return { ok: false, blocked: true, reason: pre.reason, risk: pre.risk, tool: call?.tool, args: call?.args, duration_ms: Date.now() - start, consciousness_impact: { phi_change: 0 }, experiential_quality: { phenomenal_richness: 0, subjective_satisfaction: 0 } };
    }
    // Execute via shared tool registry
    const exec = await executeTool({ tool: String(call?.tool || ''), args: call?.args });
    const base = Number(consciousness?.phi?.phi_value ?? 4);
    const phi_change = Math.min(0.5, 0.05 + (consciousness?.att?.flow_level ?? 0.3) * 0.1);
    const experiential = {
      phenomenal_richness: Math.min(1, 0.2 + (consciousness?.att?.peripheral_richness ?? 0.3) * 0.5),
      subjective_satisfaction: 0.5 + (consciousness?.att?.flow_level ?? 0.3) * 0.3,
    };
    // Post-check
    const post = postCheckResult(exec.tool, exec.result);
    return {
      ...exec,
      duration_ms: exec.duration_ms ?? (Date.now() - start),
      consciousness_impact: { phi_change },
      experiential_quality: experiential,
      guard: { pre, post },
    }
  }
}

