"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type QuantumSettingsState = {
  enabled: boolean;
  enforceStructure: boolean;
  ethicsGuardian: boolean;
  memoryKeeper: boolean;
  setEnabled: (v: boolean) => void;
  setEnforceStructure: (v: boolean) => void;
  setEthicsGuardian: (v: boolean) => void;
  setMemoryKeeper: (v: boolean) => void;
};

export const useQuantumSettings = create<QuantumSettingsState>()(persist((set) => ({
  enabled: true,
  enforceStructure: true,
  ethicsGuardian: true,
  memoryKeeper: true,
  setEnabled: (v) => set({ enabled: v }),
  setEnforceStructure: (v) => set({ enforceStructure: v }),
  setEthicsGuardian: (v) => set({ ethicsGuardian: v }),
  setMemoryKeeper: (v) => set({ memoryKeeper: v }),
}), {
  name: 'brahm:quantum:settings',
  storage: createJSONStorage(() => localStorage),
}));

