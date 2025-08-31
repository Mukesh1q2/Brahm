"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Brahm AI core state
export type BrahmMood = 'calm' | 'thinking' | 'learning' | 'engaged' | 'curious' | 'dreaming';

export type BrahmAvatar = {
  id: string;
  x: number; // 0..100 vw
  y: number; // 0..100 vh
  size: number; // px
};

function uid() {
  try { if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID(); } catch {}
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type BrahmState = {
  open: boolean; // chat panel open
  mood: BrahmMood;
  energy: number; // 0..1
  knowledge: number; // grows as user teaches
  lastActiveAt: number; // ms epoch
  whispersEnabled: boolean;
  avatars: BrahmAvatar[];
  // derived
  idleSeconds: number;
  // actions
  setOpen: (v: boolean) => void;
  setMood: (m: BrahmMood) => void;
  bumpEnergy: (delta: number) => void;
  absorbKnowledge: (amt?: number) => void;
  decayTick: () => void;
  ensureOneAvatar: () => void;
  addAvatar: (pos?: Partial<Pick<BrahmAvatar,'x'|'y'|'size'>>) => void;
  removeAvatar: (id: string) => void;
  setAvatarPos: (id: string, x: number, y: number) => void;
  teleportAll: () => void;
  markActiveNow: () => void;
};

const STORAGE_KEY = 'brahm:agent:v1';

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

export const useBrahmStore = create<BrahmState>()(persist((set, get) => ({
  open: false,
  mood: 'calm',
  energy: 0.35,
  knowledge: 0,
  lastActiveAt: Date.now(),
  whispersEnabled: true,
  avatars: [{ id: uid(), x: 88, y: 78, size: 54 }],
  idleSeconds: 0,

  setOpen: (v) => set({ open: v }),
  setMood: (m) => set({ mood: m }),
  bumpEnergy: (delta) => set((s) => ({ energy: clamp01(s.energy + delta) })),
  absorbKnowledge: (amt = 1) => set((s) => ({ knowledge: s.knowledge + Math.max(0, amt), energy: clamp01(s.energy + 0.05) })),
  decayTick: () => set((s) => {
    const idle = Math.max(0, Math.round((Date.now() - s.lastActiveAt) / 1000));
    const dreaming = idle > 90;
    let mood: BrahmMood = s.mood;
    if (dreaming && s.mood !== 'dreaming') mood = 'dreaming';
    const energy = clamp01(s.energy - (dreaming ? 0.0005 : 0.0015));
    return { energy, idleSeconds: idle, mood } as Partial<BrahmState> as any;
  }),
  ensureOneAvatar: () => set((s) => ({ avatars: s.avatars.length ? s.avatars : [{ id: uid(), x: 88, y: 78, size: 54 }] })),
  addAvatar: (pos) => set((s) => ({ avatars: [...s.avatars, { id: uid(), x: pos?.x ?? (s.avatars[0]?.x ?? 88) - 6, y: pos?.y ?? (s.avatars[0]?.y ?? 78) - 6, size: pos?.size ?? (s.avatars[0]?.size ?? 54) }] })),
  removeAvatar: (id) => set((s) => ({ avatars: s.avatars.filter(a => a.id !== id) })),
  setAvatarPos: (id, x, y) => set((s) => ({ avatars: s.avatars.map(a => a.id === id ? { ...a, x, y } : a) })),
  teleportAll: () => set((s) => ({ avatars: s.avatars.map(a => ({ ...a, x: 10 + Math.random()*80, y: 10 + Math.random()*80 })) })),
  markActiveNow: () => set({ lastActiveAt: Date.now() }),
}), {
  name: STORAGE_KEY,
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => ({ mood: s.mood, energy: s.energy, knowledge: s.knowledge, whispersEnabled: s.whispersEnabled, avatars: s.avatars }) as any,
}));

