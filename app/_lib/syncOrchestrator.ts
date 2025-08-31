import { LocalStorageQueue } from './syncQueue';
import { SyncClient } from './syncClient';
import { useChatStore } from '@/app/_stores/chatStore';

let started = false;

export function startSyncOrchestrator() {
  if (started) return;
  const enabled = (process.env.NEXT_PUBLIC_PERSIST_REMOTE ?? 'false') !== 'false';
  if (!enabled) return;
  started = true;

  const base = '';
  const client = new SyncClient({ base, enabled: true, getAuthToken: () => { try { return localStorage.getItem('access_token'); } catch { return null; } } });
  const queue = new LocalStorageQueue();

  // Subscribe to chat store changes to enqueue upserts
  const seenConvs = new Set<string>();
  const seenMsgs = new Set<string>();
  try {
    const snapshot = useChatStore.getState();
    for (const c of snapshot.conversations) {
      seenConvs.add(c.id);
      for (const m of c.messages) seenMsgs.add(m.id);
    }
  } catch {}

  useChatStore.subscribe((s) => {
    // Detect new conversations
    for (const c of s.conversations) {
      if (!seenConvs.has(c.id)) {
        seenConvs.add(c.id);
        const nowIso = new Date().toISOString();
        queue.enqueueConversation({ id: c.id, title: c.title, createdAt: new Date(c.createdAt).toISOString(), updatedAt: nowIso });
      }
      // Detect new messages
      for (const m of c.messages) {
        if (!seenMsgs.has(m.id)) {
          seenMsgs.add(m.id);
          const nowIso = new Date().toISOString();
          queue.enqueueMessage({ id: m.id, conversationId: c.id, role: m.role as any, content: m.content, meta: m.meta ?? null, createdAt: new Date(m.createdAt).toISOString(), updatedAt: nowIso });
        }
      }
    }
  });

  async function tick() {
    try { await queue.flush(client); } catch {}
  }
  // Flush periodically and on network online
  const interval = setInterval(tick, 5000);
  window.addEventListener('online', tick);
  // Initial flush
  tick();
  // Expose for debug
  // @ts-ignore
  window.__sync__ = { queue, client };
}
