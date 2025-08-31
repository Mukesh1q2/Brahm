import { NextResponse } from 'next/server';
import type { ConsoleEventResponse } from '@/types/events';

// Simple time-based state progression to avoid stuck pipeline UI
let START_TS = Date.now();
export async function GET() {
  const now = Date.now();
  const elapsed = Math.floor((now - START_TS) / 1000); // seconds since server warmed
  // thresholds in seconds
  const tPlan = 0;
  const tRetrieve = 0;
  const tDebateStart = 1;
  const tDebateDone = 6;
  const tValidateStart = 6;
  const tValidateDone = 9;
  const tAnswerStart = 9;
  const tAnswerDone = 12;

  type EvolutionState = 'planned' | 'running' | 'succeeded' | 'failed';
  function stateFor(kind: 'plan'|'retrieve'|'debate'|'validate'|'answer'): EvolutionState {
    if (kind === 'plan') return 'succeeded';
    if (kind === 'retrieve') return 'succeeded';
    if (kind === 'debate') return elapsed >= tDebateDone ? 'succeeded' : (elapsed >= tDebateStart ? 'running' : 'planned');
    if (kind === 'validate') return elapsed >= tValidateDone ? 'succeeded' : (elapsed >= tValidateStart ? 'running' : 'planned');
    if (kind === 'answer') return elapsed >= tAnswerDone ? 'succeeded' : (elapsed >= tAnswerStart ? 'running' : 'planned');
    return 'planned';
  }
  const mk = (i: number, kind: 'plan'|'retrieve'|'debate'|'validate'|'answer') => ({
    id: String(i),
    ts: new Date(now - i * 30_000).toISOString(),
    kind,
    title: `${kind.toUpperCase()} step`,
    state: stateFor(kind),
    costUSD: Math.round(Math.random() * 100) / 100,
    summary: `Auto step ${i}`,
  });
  const items = [
    mk(1, 'plan'),
    mk(2, 'retrieve'),
    mk(3, 'debate'),
    mk(4, 'validate'),
    mk(5, 'answer'),
  ];
  const resp: ConsoleEventResponse = { total: items.length, items };
  return NextResponse.json(resp);
}

