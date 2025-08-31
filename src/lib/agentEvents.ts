import { useAgentEventBus } from "@/store/agentEventBus";
import type { AgentEvent } from "@/types/AgentEvents";

export function pushRunStart(runId: string, agent: string, timestamp = Date.now()) {
  useAgentEventBus.getState().push({ type: "run:start", runId, agent, timestamp });
}

export function pushRunEnd(runId: string, success: boolean, timestamp = Date.now()) {
  useAgentEventBus.getState().push({ type: "run:end", runId, success, timestamp });
}

export function pushTrace(runId: string, summary: string, json: unknown) {
  useAgentEventBus.getState().push({ type: "trace", runId, summary, json });
}

export function pushPatch(runId: string, original: string, modified: string, language?: string) {
  useAgentEventBus.getState().push({ type: "patch", runId, original, modified, language });
}

export type { AgentEvent };

// Adapter: map Conscious Kernel events to AgentEvent bus entries
export function pushKernelEvent(ev: any) {
  try {
    const bus = useAgentEventBus.getState();
    if (ev.type === 'run:start') {
      bus.push({ type: 'run:start', runId: ev.runId, agent: 'kernel', timestamp: Date.now() });
    } else if (ev.type === 'run:end') {
      bus.push({ type: 'run:end', runId: ev.runId, success: ev.success, timestamp: Date.now() });
    } else if (ev.type === 'broadcast') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: ev.broadcast?.summary || '', json: ev });
    } else if (ev.type === 'experience') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: 'Experience', json: ev.experience });
    } else if (ev.type === 'phi') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `Phi=${ev.measurement?.phi_value?.toFixed?.(2) ?? ''}`, json: ev });
    } else if (ev.type === 'cips:coalitions') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      const count = Array.isArray(ev.items) ? ev.items.length : 0;
      bus.push({ type: 'trace', runId, summary: `Coalitions:${count}`, json: ev });
    } else if (ev.type === 'cips:workspace_winner') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `Winner:${ev.coalition?.id || ''}` , json: ev });
    } else if (ev.type === 'cips:qualia') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `Qualia S:${ev.qualia?.sensory?.toFixed?.(2)} C:${ev.qualia?.cognitive?.toFixed?.(2)}`, json: ev });
    } else if (ev.type === 'cips:prediction') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `PredErr=${(ev.error ?? 0).toFixed?.(3)}`, json: ev });
    } else if (ev.type === 'cips:self_model') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `SelfModel conf=${(ev.confidence ?? 0).toFixed?.(2)}`, json: ev });
    } else if (ev.type === 'cips:evolution') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `Evolve+${(ev.improvements||[]).length}/${(ev.accepted||[]).length}`, json: ev });
    } else if (ev.type === 'cips:weights') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      const g = Number(ev.weights?.gwt ?? 0).toFixed(2), c = Number(ev.weights?.causal ?? 0).toFixed(2), p = Number(ev.weights?.pp ?? 0).toFixed(2);
      bus.push({ type: 'trace', runId, summary: `Weights(${g},${c},${p})`, json: ev });
    } else if (ev.type === 'stability') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `Stability=${ev.assessment?.stability_score?.toFixed?.(2) ?? ''} (${ev.assessment?.risk_level||''})`, json: ev });
    } else if (ev.type === 'attention') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `Attention=${(ev.state?.attention_strength ?? 0).toFixed?.(2)}`, json: ev });
    } else if (ev.type === 'salience') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `Salience=${(ev.score ?? 0).toFixed?.(2)}`, json: ev });
    } else if (ev.type === 'tool') {
      const runId = (bus.events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
      bus.push({ type: 'trace', runId, summary: `Tool:${ev.name}`, json: ev.result });
    }
  } catch {}
}

