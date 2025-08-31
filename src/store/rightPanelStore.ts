import { create } from "zustand";

export type TabKey = "summary" | "trace" | "json" | "diff" | "memory" | "experiences" | "kernel" | "council";

const KEY_TAB = "brahm:rightPanel:tab";
const KEY_ACTIVE_RUN = "brahm:rightPanel:activeRun";

type RightPanelState = {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  activeRunId: string | null;
  setActiveRun: (id: string | null) => void;
  hydrate: () => void;
};

export const __RIGHT_PANEL_KEY__ = KEY_TAB;

export const useRightPanelStore = create<RightPanelState>((set, get) => ({
  tab: "summary",
  setTab: (t) => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(KEY_TAB, t);
    } catch {}
    set({ tab: t });
  },
  activeRunId: null,
  setActiveRun: (id) => {
    try {
      if (typeof window !== 'undefined') {
        if (id == null) localStorage.removeItem(KEY_ACTIVE_RUN);
        else localStorage.setItem(KEY_ACTIVE_RUN, id);
      }
    } catch {}
    set({ activeRunId: id });
  },
  hydrate: () => {
    try {
      if (typeof window !== 'undefined') {
        const v = localStorage.getItem(KEY_TAB) as TabKey | null;
        if (v) set({ tab: v });
        const run = localStorage.getItem(KEY_ACTIVE_RUN);
        set({ activeRunId: run || null });
      }
    } catch {}
  },
}));

