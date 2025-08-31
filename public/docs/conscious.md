# Brahm Conscious AI - Enhanced Specification (Phase 1 scaffolding)

This document captures the high-level architecture and maps it to the codebase, starting with a Phase 1 kernel and Phase 2 interfaces that can be implemented incrementally.

References:
- Core kernel: src/lib/conscious/kernel.ts
- Types: src/types/Conscious.ts
- SSE: app/api/agents/stream/route.ts
- Run API: app/api/agents/run/route.ts
- Dev page (SSE tester): app/agents/dev/page.tsx

Module injection (Phase 2)
The kernel is constructed with default no-op modules. Replace them with real implementations by editing src/lib/conscious/kernel.ts or by adding a factory/DI later.
- AttentionSystem: src/lib/conscious/attention.ts (NoopAttentionSystem)
- SalienceEngine: src/lib/conscious/salience.ts (NoopSalienceEngine)
- AdvancedPhiCalculator: src/lib/conscious/phi.ts (NoopPhiCalculator)
- EnhancedMemory: src/lib/conscious/memory.ts (InMemoryEnhancedMemory)
- MetaCognitiveSystem: src/lib/conscious/metacog.ts (NoopMetaCognitiveSystem)
- EnhancedEthicsSystem: src/lib/conscious/ethics.ts (NoopEthicsSystem)
- ConsciousToolSystem: src/lib/conscious/tools.ts (NoopConsciousToolSystem)
- AdvancedConsciousnessSafety: src/lib/conscious/safety.ts (NoopConsciousnessSafety)

Wiring the UI
- Non-stream: POST /api/agents/run { goal, steps? } → returns transcript/summary/diff used by Canvas and Right Panel.
- Stream: GET /api/agents/stream?goal=...&steps=... → RightContextPanel "Stream Run" consumes SSE and pushes events into the global agent event bus (trace/json rendering tabs).
- Dev: visit /agents/dev to start/stop an SSE stream and inspect raw events.

Replacing Noop modules
1. Implement your concrete module in the matching file (or a new file) exporting the same interface.
2. Swap instantiation in the kernel constructor, e.g.:
   this.attention = new MyAttentionSystem(params)
3. Extend KernelEvent typing if you emit richer events (e.g., qualia_generation). The Right Panel trace tab will show JSON automatically; we can add a richer renderer when the schemas are stable.

Security & telemetry
- Middleware applies rate limiting and auth for specific API groups.
- Model headers and client telemetry events are preserved for Console/Header metrics.

Next steps:
- Implement concrete modules per your spec and progressively replace Noops.
- Extend RightContextPanel to render enhanced events (attention/phi/qualia) with dedicated views.
- Add guardian pre/post tool checks and route tool calls to /api/tools/execute.

