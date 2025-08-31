import { create } from "zustand";

export type CouncilTrace = { name: string; output: string };
export type CouncilData = { trace: CouncilTrace[]; votes?: Record<string, number>; spotlight?: string } | null;

export type RightPanelData = {
  summary?: string;
  json?: unknown;
  codeDiff?: { original: string; modified: string; language?: string } | null;
  council?: CouncilData;
};

type State = RightPanelData & {
  setAll: (d: RightPanelData) => void;
  setCodeDiff: (d: { original: string; modified: string; language?: string } | null) => void;
};

export const useRightPanelData = create<State>((set) => ({
  summary: undefined,
  json: undefined,
  codeDiff: null,
  setAll: (d) => set({ ...d }),
  setCodeDiff: (d) => set({ codeDiff: d }),
}));

