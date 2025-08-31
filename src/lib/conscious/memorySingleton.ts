import { InMemoryEnhancedMemory } from "./memory";

// Share memory instance globally across module reloads and route contexts
export function getMemory() {
  const g: any = globalThis as any;
  if (!g.__brahm_ck_mem__) g.__brahm_ck_mem__ = new InMemoryEnhancedMemory();
  return g.__brahm_ck_mem__ as InMemoryEnhancedMemory;
}
