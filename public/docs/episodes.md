# Episodic Memory

This system captures and persists episodic experiences during conscious kernel runs.

- Episodes are emitted by the kernel via `experience` events with fields like: id, timestamp, main_content, phi_level, qualia_count, duration_ms.
- Episodes are persisted in two layers:
  - In-memory: `InMemoryEnhancedMemory` for demo and test environments
  - Optional Postgres: `episodes` table via helper functions in `/api/_lib/pg.ts` when `PG_DSN` (or DATABASE_URL) is configured

API routes
- GET /api/memory/episodes — list episodes with filters
  - q: substring match on main_content
  - since: unix ms lower bound for timestamp
  - phi_min, phi_max: numeric range filter for phi_level
  - label: repeatable label filter
    - By default, labels use AND semantics (the row must contain all specified labels)
    - To use OR semantics (row contains any of the labels), pass `mode=or` (or `labels_mode=or`)
  - limit: cap the results (1..500)

Examples
- AND: `/api/memory/episodes?label=alpha&label=beta`
- OR: `/api/memory/episodes?label=alpha&label=beta&mode=or`

UI integration
- Right Context Panel → Memory tab: lists episodes with search, time window, phi range, label chips, and a details drawer.
  - Labels UI appears when `NEXT_PUBLIC_PERSIST_REMOTE=true` so that the list is backed by DB.
- Experiences tab: shows DB vs in-memory episodes, useful for local dev.

Persistence details
- Postgres table `episodes` includes: id, ts, main_content, phi_level, attention_strength, labels, phenomenology, significance, retrieval_count, last_accessed.
- Helpful indexes are created automatically: GIN on `labels`, B-tree on `ts` and `phi_level`.
- The kernel inserts with a best-effort call to `insertEpisodeSafe` (non-blocking).

Stability mitigation
- When stability risk escalates to high/critical, you can enable auto-mitigation to reduce steps and adjust phi weights in real-time.
- Auto-mitigation is subject to an escalation check and a cooldown (~30s) to prevent thrash.
- Toggle this in the Right Panel.

Feature flags (env)
- NEXT_PUBLIC_EPISODIC_MEMORY=true
- NEXT_PUBLIC_STABILITY_MITIGATION=true
- NEXT_PUBLIC_MITIGATION_COOLDOWN_MS=30000 (optional) — cooldown for applying auto-mitigation in ms
- NEXT_PUBLIC_PERFORMANCE_CONTROLS=true
- NEXT_PUBLIC_PERSIST_REMOTE=true to use DB-backed episodes list in the Memory tab

Testing
- Unit tests cover the episodes list route and Memory tab behaviors.
- For E2E, set NEXT_PUBLIC_E2E_HOOKS=true to expose limited debug hooks.
- To make E2E independent of DB availability, set BRAHM_E2E_DISABLE_DB=true (and optionally NEXT_PUBLIC_PERSIST_REMOTE=false). The UI will auto-detect persistence status via /api/persistence/status and fall back to in-memory flows.
- E2E includes a smoke that starts a stream, injects a stability event, and verifies auto-mitigation UI updates.

