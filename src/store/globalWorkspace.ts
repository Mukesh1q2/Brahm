import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
const HALF_PI = Math.PI / 2;

export type WorkspaceMetrics = {
  measurements: number;
  outcomes: { zero: number; one: number };
  entUpdates: number;
  correlationSum: number; // running sum of E(phi)
};

export type BroadcastWinner = {
  id: string;
  source: string;
  score: number;
  summary?: string;
  at: number;
  confidence?: number;
  uncertainty?: number;
  ethics?: string; // allow | revise | veto
};

export type WorkspaceState = {
  currentSection: string | null;
  attention: number; // 0..1
  phiEstimate: number; // 0..10
  superpositionTheta: number; // 0..pi/2
  superpositionOutcome: 0 | 1 | null;
  entanglementPhi: number; // 0..pi/2
  metrics: WorkspaceMetrics;
  lastBroadcast?: BroadcastWinner | null;
  // setters / actions
  setCurrentSection: (id: string | null) => void;
  setAttention: (v: number) => void;
  setPhi: (v: number) => void;
  setSuperpositionTheta: (v: number) => void;
  recordMeasurement: (outcome: 0 | 1) => void;
  resetMeasurement: () => void;
  setEntanglementPhi: (v: number) => void;
  recordEntanglementUpdate: (phi: number, correlation: number) => void;
  resetMetrics: () => void;
  publishBroadcast: (w: BroadcastWinner) => void;
};

export const useGlobalWorkspace = create<WorkspaceState>()(persist((set, get) => ({
  currentSection: null,
  attention: 0.2,
  phiEstimate: 1.0,
  superpositionTheta: Math.PI / 4,
  superpositionOutcome: null,
  entanglementPhi: Math.PI / 4,
  metrics: { measurements: 0, outcomes: { zero: 0, one: 0 }, entUpdates: 0, correlationSum: 0 },
  lastBroadcast: null,

  setCurrentSection: (id) => set({ currentSection: id }),
  setAttention: (v) => set({ attention: clamp(v, 0, 1) }),
  setPhi: (v) => set({ phiEstimate: clamp(v, 0, 10) }),
  setSuperpositionTheta: (v) => set({ superpositionTheta: clamp(v, 0, HALF_PI) }),
  recordMeasurement: (outcome) => set((s) => ({
    superpositionOutcome: outcome,
    metrics: {
      measurements: s.metrics.measurements + 1,
      outcomes: { zero: s.metrics.outcomes.zero + (outcome === 0 ? 1 : 0), one: s.metrics.outcomes.one + (outcome === 1 ? 1 : 0) },
      entUpdates: s.metrics.entUpdates,
      correlationSum: s.metrics.correlationSum,
    }
  })),
  resetMeasurement: () => set({ superpositionOutcome: null }),
  setEntanglementPhi: (v) => set({ entanglementPhi: clamp(v, 0, HALF_PI) }),
  recordEntanglementUpdate: (phi, correlation) => set((s) => ({
    metrics: {
      measurements: s.metrics.measurements,
      outcomes: s.metrics.outcomes,
      entUpdates: s.metrics.entUpdates + 1,
      correlationSum: s.metrics.correlationSum + correlation,
    }
  })),
  resetMetrics: () => set({ metrics: { measurements: 0, outcomes: { zero: 0, one: 0 }, entUpdates: 0, correlationSum: 0 } }),
  publishBroadcast: (w) => set({ lastBroadcast: w }),
}), {
  name: 'brahm_workspace',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => ({
    currentSection: s.currentSection,
    superpositionTheta: s.superpositionTheta,
    superpositionOutcome: s.superpositionOutcome,
    entanglementPhi: s.entanglementPhi,
    metrics: s.metrics,
    lastBroadcast: s.lastBroadcast,
  }) as any,
}));

