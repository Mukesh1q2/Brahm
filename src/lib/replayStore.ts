import type { ReplayEvent } from '@/types/replay';

const MAX_EVENTS = 5000;
let store: ReplayEvent[] = [];

export function addReplay(events: ReplayEvent | ReplayEvent[]) {
  const arr = Array.isArray(events) ? events : [events];
  for (const e of arr) {
    store.push(e);
  }
  if (store.length > MAX_EVENTS) {
    store = store.slice(store.length - MAX_EVENTS);
  }
}

export function latestReplay(limit = 100): { total: number; items: ReplayEvent[] } {
  const total = store.length;
  const items = store.slice(Math.max(0, total - limit));
  return { total, items };
}

export function clearReplay() {
  store = [];
}

