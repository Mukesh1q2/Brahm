"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type EpisodeEntry = {
  id: string;
  ts: number;
  prompt?: string;
  response?: string;
  summary: string;
  tags: string[];
};

export type EpisodesState = {
  episodes: EpisodeEntry[];
  add: (e: Omit<EpisodeEntry, 'id'|'ts'>) => string;
  recent: (n: number) => EpisodeEntry[];
};

function uid() {
  try { if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID(); } catch {}
  return `EP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
}

export const useEpisodes = create<EpisodesState>()(persist((set, get) => ({
  episodes: [],
  add: (e) => {
    const id = uid();
    const ts = Date.now();
    const entry: EpisodeEntry = { id, ts, ...e } as EpisodeEntry;
    set(s => ({ episodes: [entry, ...s.episodes].slice(0, 200) }));
    return id;
  },
  recent: (n) => {
    const all = get().episodes;
    return all.slice(0, Math.max(0, n));
  }
}), {
  name: 'brahm:episodes:v1',
  storage: createJSONStorage(() => localStorage),
}));

