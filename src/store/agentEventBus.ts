import { create } from "zustand";
import type { AgentEvent } from "@/types/AgentEvents";

type BusState = {
  events: AgentEvent[];
  push: (e: AgentEvent) => void;
  clear: () => void;
};

export const useAgentEventBus = create<BusState>((set) => ({
  events: [],
  push: (e) => set((s) => ({ events: [...s.events, e] })),
  clear: () => set({ events: [] }),
}));

