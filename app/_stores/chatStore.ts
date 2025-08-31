import { create } from "zustand";

export type Role = "user" | "assistant" | "system";
export type Message = { id: string; role: Role; content: string; createdAt: number; meta?: any; };
export type Conversation = { id: string; title: string; createdAt: number; messages: Message[]; model?: string; };

function uid() {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

type State = {
  conversations: Conversation[];
  activeId?: string;
  creating: boolean;
  newConversation: () => string;
  setActive: (id: string) => void;
  pushMessage: (msg: Omit<Message,"id"|"createdAt">) => void;
  replaceLastAssistant: (content: string, meta?: any) => void;
  renameActive: (title: string) => void;
  deleteMessage: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearActive: () => void;
};

const STORAGE_KEY = 'brahm:chat:conversations';

function loadPersisted(): { conversations: Conversation[]; activeId?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversations: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.conversations)) return { conversations: [] };
    return { conversations: parsed.conversations, activeId: parsed.activeId };
  } catch { return { conversations: [] }; }
}

function savePersisted(state: { conversations: Conversation[]; activeId?: string }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export const useChatStore = create<State>((set, get) => ({
  conversations: (typeof window !== 'undefined' ? loadPersisted().conversations : []),
  creating: false,
  newConversation: () => {
    const id = uid();
    const c: Conversation = { id, title: "New chat", createdAt: Date.now(), messages: [] };
    set(s => {
      const next = { conversations: [c, ...s.conversations], activeId: id } as any;
      if (typeof window !== 'undefined') savePersisted(next);
      return next;
    });
    return id;
  },
  setActive: (id) => set(s => { const next = { ...s, activeId: id } as any; if (typeof window !== 'undefined') savePersisted(next); return next; }),
  pushMessage: (msg) => {
    const id = uid();
    const m: Message = { id, createdAt: Date.now(), ...msg };
    set(s => {
      const next = {
        ...s,
        conversations: s.conversations.map(c =>
          c.id === s.activeId ? { ...c, messages: [...c.messages, m] } : c
        ),
      } as any;
      if (typeof window !== 'undefined') savePersisted(next);
      return next;
    });
  },
  replaceLastAssistant: (content, meta) => {
    const { activeId, conversations } = get();
    if (!activeId) return;
    const c = conversations.find(c => c.id === activeId);
    if (!c) return;
    const idx = [...c.messages].reverse().findIndex(m => m.role === "assistant");
    if (idx === -1) return;
    const real = c.messages.length - 1 - idx;
    const updated = [...c.messages];
    updated[real] = { ...updated[real], content, meta };
    set(s => {
      const next = {
        conversations: s.conversations.map(cc => cc.id === activeId ? { ...cc, messages: updated } : cc),
        activeId: s.activeId,
        creating: s.creating,
      } as any;
      if (typeof window !== 'undefined') savePersisted(next);
      return next;
    });
  },
  renameActive: (title) => set(s => { const next = { conversations: s.conversations.map(c => c.id === s.activeId ? { ...c, title } : c), activeId: s.activeId, creating: s.creating } as any; if (typeof window !== 'undefined') savePersisted(next); return next; }),
  deleteMessage: (id) => set(s => { const next = { conversations: s.conversations.map(c => (c.id === s.activeId ? { ...c, messages: c.messages.filter(m => m.id !== id) } : c)), activeId: s.activeId, creating: s.creating } as any; if (typeof window !== 'undefined') savePersisted(next); return next; }),
  deleteConversation: (id: string) => set(s => {
    const filtered = s.conversations.filter(c => c.id !== id);
    const wasActive = s.activeId === id;
    const nextActive = wasActive ? (filtered[0]?.id) : s.activeId;
    const next = { conversations: filtered, activeId: nextActive, creating: s.creating } as any;
    if (typeof window !== 'undefined') savePersisted(next);
    return next;
  }),
  clearActive: () => set(s => {
    if (!s.activeId) return s as any;
    const nextConvs = s.conversations.map(c => c.id === s.activeId ? { ...c, messages: [] } : c);
    const next = { conversations: nextConvs, activeId: s.activeId, creating: s.creating } as any;
    if (typeof window !== 'undefined') savePersisted(next);
    return next;
  }),
}));

