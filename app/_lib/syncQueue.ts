// Offline-first queue persisted in localStorage with basic LWW semantics
import { SyncClient, type SyncConversation, type SyncMessage } from './syncClient';

type QueueItem =
  | { kind: 'conversation', updatedAt: number, payload: SyncConversation }
  | { kind: 'message', updatedAt: number, payload: SyncMessage };

const KEY_QUEUE = 'brahm:sync:queue:v1';
const KEY_ACK = 'brahm:sync:lastAck:v1';

function loadJSON<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); if (!raw) return fallback; return JSON.parse(raw) as T; } catch { return fallback; }
}
function saveJSON<T>(key: string, val: T) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

const MAX_QUEUE = 1000;

export class LocalStorageQueue {
  private items: QueueItem[] = [];
  private lastAck: Record<string, number> = {};
  private flushing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.items = loadJSON(KEY_QUEUE, [] as QueueItem[]);
      this.lastAck = loadJSON(KEY_ACK, {} as Record<string, number>);
      // Trim any legacy overflows
      if (this.items.length > MAX_QUEUE) this.items = this.items.slice(-MAX_QUEUE);
    }
  }

  enqueueConversation(c: SyncConversation) {
    const id = c.id;
    const updatedAt = Date.now();
    if (this.lastAck[id] && updatedAt <= this.lastAck[id]) return; // LWW: stale
    this.items.push({ kind: 'conversation', updatedAt, payload: c });
    if (this.items.length > MAX_QUEUE) this.items = this.items.slice(-MAX_QUEUE);
    this.persist();
  }
  enqueueMessage(m: SyncMessage) {
    const id = m.id;
    const updatedAt = Date.now();
    if (this.lastAck[id] && updatedAt <= this.lastAck[id]) return; // LWW
    this.items.push({ kind: 'message', updatedAt, payload: m });
    if (this.items.length > MAX_QUEUE) this.items = this.items.slice(-MAX_QUEUE);
    this.persist();
  }

  private persist() { saveJSON(KEY_QUEUE, this.items); saveJSON(KEY_ACK, this.lastAck); }

  async flush(client: SyncClient) {
    if (this.flushing) return;
    // Optional: skip aggressive flush when offline
    try { if (typeof navigator !== 'undefined' && 'onLine' in navigator && (navigator as any).onLine === false) return; } catch {}
    this.flushing = true;
    try {
      const next: QueueItem[] = [];
      for (const it of this.items) {
        try {
          if (it.kind === 'conversation') await client.upsertConversation(it.payload);
          else await client.upsertMessage(it.payload);
          const key = it.kind === 'conversation' ? it.payload.id : it.payload.id;
          this.lastAck[key] = it.updatedAt;
        } catch (e) {
          // keep for retry
          next.push(it);
        }
      }
      this.items = next;
      this.persist();
    } finally {
      this.flushing = false;
    }
  }

  // For diagnostics in tests
  size() { return this.items.length; }
}
