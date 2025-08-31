# Brahm AI — Tracked Issue List

Legend
- Priority: P0 (must have), P1 (next), P2 (nice), P3 (later)
- Labels: phase:<N>, priority:P0|P1|P2|P3, area:<ui|api|agents|persistence|infra|testing>
- Dependencies noted inline

Note: You can seed GitHub issues using docs/tracking/issues.json with the GitHub CLI (see that file for a one-liner).

---

## Phase 2 — Metadata envelopes + auto-open UX

- [ ] P0: Wire envelope parser into chat stream (area:ui, phase:2)
  - DoD: Streaming chat updates Right Panel automatically; diff envelope opens Diff tab; errors don’t break stream.
  - Deps: none
- [ ] P0: Centralize envelope types + runtime validation (area:ui, phase:2)
  - DoD: Types exported from src/types; guard or zod validation at boundaries; server routes emit valid envelopes.
  - Deps: none
- [ ] P1: Auto-open policy + tab badges (area:ui, phase:2)
  - DoD: “Follow envelopes” toggle; new-tab badge on updates; keyboard toggle.
  - Deps: P0 wiring
- [ ] P2: Envelope telemetry counts (area:testing, phase:2)
  - DoD: Telemetry aggregates per-run counts and sizes; surfaced in Console.
  - Deps: P0 wiring
- [ ] P0: Tests & docs for envelopes (area:testing, phase:2)
  - DoD: E2E proving reasoning+diff triggers; unit tests for parser edge cases; WARP.md snippet.
  - Deps: P0 wiring

---

## Phase 3 — Backend persistence (next-auth + Prisma/Postgres)

- [ ] P0: Next-auth JWT config + smoke route (area:api, phase:3)
  - DoD: AUTH_SECRET/NEXTAUTH_URL documented; /api/ping-auth returns 200 only with token; e2e smoke passes.
  - Deps: none
- [ ] P0: Prisma schema + migrations (area:persistence, phase:3)
  - DoD: schema.prisma (conversations/messages); migrations run locally; docs updated.
  - Deps: none
- [ ] P0: /api/conversations GET(since)/POST(upsert) (area:api, phase:3)
  - DoD: Auth required; payload validate; returns normalized shape; telemetry for latency.
  - Deps: auth, schema
- [ ] P0: /api/messages GET/POST (area:api, phase:3)
  - DoD: Auth required; payload validate; returns normalized shape; telemetry for latency.
  - Deps: auth, schema
- [ ] P1: SyncClient integration & auth header propagation (area:ui, phase:3)
  - DoD: Gated by NEXT_PUBLIC_PERSIST_REMOTE; base URL + bearer handled; retry on 401.
  - Deps: endpoints
- [ ] P2: LocalStorage → server migration (area:persistence, phase:3)
  - DoD: First-auth uploads local conversations/messages with timestamps; dedupe guaranteed.
  - Deps: endpoints
- [ ] P1: Observability & rate limits (area:infra, phase:3)
  - DoD: Telemetry for persistence routes; write limits documented; middleware adjusted as needed.
  - Deps: endpoints

---

## Phase 4 — Sync client (offline-first with LWW)

- [ ] P0: Client queue with persistence (area:ui, phase:4)
  - DoD: In-memory + local persistence; retry/backoff; flush on online/auth.
  - Deps: Phase 3 endpoints
- [ ] P0: LWW conflict resolution (area:ui, phase:4)
  - DoD: updatedAt semantics; merge strategies for content/meta; conflicts logged to telemetry.
  - Deps: Phase 3 endpoints
- [ ] P1: Sync orchestration (initial + periodic) (area:ui, phase:4)
  - DoD: Initial sync on auth; polling with since; batching & backpressure.
  - Deps: P0 queue
- [ ] P1: Failure handling & durability (area:ui, phase:4)
  - DoD: Offline detection; queue caps; user notification on drops.
  - Deps: P0 queue
- [ ] P1: Tests (offline→online + LWW) (area:testing, phase:4)
  - DoD: E2E offline create then online merge; unit tests for queue replay and LWW.
  - Deps: Phase 3/4
- [ ] P2: Performance tuning (area:ui, phase:4)
  - DoD: Batch sizes/jitter refined; UI progress indicator.
  - Deps: orchestration

---

## Phase 5 — Agents + SSE (executive function)

- [ ] P0: Define AgentEvent schema v1 (area:agents, phase:5)
  - DoD: Extended types (debate/validate/execute/patch); versioned; bus compatible.
  - Deps: none
- [ ] P0: Harden SSE route (heartbeats/timeouts) (area:api, phase:5)
  - DoD: Heartbeats; idle timeout; backpressure-aware chunking; query filters.
  - Deps: none
- [ ] P1: Trace tab integration (area:ui, phase:5)
  - DoD: Lifecycle rendered in Trace; last N events retained; clear controls.
  - Deps: schema
- [ ] P2: Audit hooks for allowed/denied actions (area:infra, phase:5)
  - DoD: Emissions to audit store; Console displays.
  - Deps: schema
- [ ] P1: Tests (SSE lifecycle → Trace) (area:testing, phase:5)
  - DoD: E2E runs emit lifecycle; UI renders; unit tests for reducers.
  - Deps: hardened SSE

---

## Phase 6 — Right Panel extensions (conscious access)

- [ ] P1: Memory tab (backend-aware) (area:ui, phase:6)
  - DoD: Fetch recent conversations/messages; pagination/filters.
  - Deps: Phase 3
- [ ] P1: Trace timeline (agent lifecycle) (area:ui, phase:6)
  - DoD: Visual timeline of plan/retrieve/debate/validate/answer; jump to events.
  - Deps: Phase 5
- [ ] P2: Diff tab multi-file + actions (area:ui, phase:6)
  - DoD: Multi-file diffs; syntax perf; copy/apply guardrails.
  - Deps: Phase 2
- [ ] P2: JSON view ergonomics (area:ui, phase:6)
  - DoD: Collapsible nodes; search/filter; copy-as-JSON.
  - Deps: none
- [ ] P2: A11y & performance (area:ui, phase:6)
  - DoD: Keyboard access; virtualization for long traces.
  - Deps: trace/memory
- [ ] P1: E2E: envelopes → tab switch; memory/traces (area:testing, phase:6)
  - DoD: End-to-end coverage for panel interactions.
  - Deps: 2/3/5

---

## Phase 7 — Conscious Kernel (seed → loop)

- [ ] P1: Kernel scaffold + emitter (area:agents, phase:7)
  - DoD: src/lib/conscious/kernel.ts loop emitting KernelEvent; no-op modules.
  - Deps: none
- [ ] P1: Module interfaces (attention/salience/phi/ethics/memory/tools/safety) (area:agents, phase:7)
  - DoD: Typed interfaces consistent with src/types/Conscious.ts.
  - Deps: scaffold
- [ ] P1: Minimal eventful run wired to SSE (area:agents, phase:7)
  - DoD: KernelEvent → SSE; UI consumes via Trace.
  - Deps: Phase 5 SSE
- [ ] P1: Test harness (deterministic seeds) (area:testing, phase:7)
  - DoD: Fixture runs; snapshot event sequences.
  - Deps: scaffold
- [ ] P2: Progressive module implementations (area:agents, phase:7)
  - DoD: Replace no-ops with heuristics; guardrails via middleware.
  - Deps: interfaces
- [ ] P2: Docs & examples (area:docs, phase:7)
  - DoD: Recipes for module swaps; interpreting events; sample runs.
  - Deps: scaffold

