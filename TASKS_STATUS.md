# Tasks Status (Source of Truth)

This file is the authoritative roadmap and task status for Project Brahm. Update this file to reflect progress. All other references should link here.

Summary
- Phases remaining: 5 (Phase 2, Phase 3, Phase 4, Advanced Edition, Quantum UX)
- Checklist totals: 92 tasks
- Completed: 6/92 (6.5%)
- Pending: 86/92

Completed
- [x] DevOps/CI/CD: GitHub Actions CI pipeline (Playwright E2E on PRs/pushes, artifacts on failure)
- [x] UI: Light/Dark theme contrast fixes (white-on-white bug)
- [x] Quantum UI: Stabilized parallax/rotation with intensity caps and prefers-reduced-motion
- [x] Chat API: Mind→Gemini fallback path with model header propagation
- [x] Debug: Floating Telemetry panel (NEXT_PUBLIC_DEBUG_PANEL)
- [x] Docs: Enterprise FAQ (/faq) with search, categories, accordions, feedback logging

Advanced Edition Rollout (4/10)
- [x] Server gating: `BRAHM_EDITION={basic|advanced}` propagated to API handlers
- [ ] Client gating: Edition store + html class hooks (in place) → gate advanced UI elements
- [ ] Advanced Docs surfacing and nav affordances (in place) → deep link new modules
- [x] Env flags: `NEXT_PUBLIC_ADV_QUANTUM`, `NEXT_PUBLIC_ADV_AGENT`, `ADV_TELEMETRY` documented
- [x] Add edition badge in footer with quick switch
- [x] SSR headers/cookies to select edition per request
- [ ] E2E: ensure edition switch does not regress hydration
- [ ] Perf budgets by edition (LCP < 2.5s basic, < 3.0s advanced on mid-tier)
- [ ] Rollout plan + kill-switch
- [ ] Docs: upgrade guide for Advanced

Phase 2 – Panini Core & Voice (0/10)
Research
- [ ] Sanskrit rule graph (400 sutras)
- [ ] Constrained decoding
- [ ] Nyaya logic checker

Voice
- [ ] VAD integration
- [ ] Wake-word detection (Porcupine)
- [ ] Whisper STT integration
- [ ] Mic kill-switch UI

Security
- [ ] Vault for secrets management
- [ ] Row-level DB permissions
- [ ] Policy audit logs

Phase 3 – Self-Improvement (0/8)
Learning
- [ ] Replay buffer schema
- [ ] LoRA fine-tuning pipeline
- [ ] Auto-PR system
- [ ] Canary deployment

Agents
- [ ] Hierarchical organization (Executive, Managers, Workers)
- [ ] Cost budget enforcement

Console
- [ ] Self-evolving timeline UI
- [ ] Diff viewer for auto-PRs

Phase 4 - Advanced (0/9)
Capabilities
- [ ] Math verifier (SymPy)
- [ ] Vision/OCR agent (Donut)
- [ ] Multi-hop RAG
- [ ] AST diff viewer

GenAI
- [ ] Stable Diffusion integration
- [ ] MusicGen integration
- [ ] License checker

Privacy
- [ ] Local-only ambient buffer
- [ ] Per-user data residency

DevOps/CI/CD (1/6)
- [x] GitHub Actions CI pipeline
- [ ] K8s deployment configs
- [ ] gVisor/Firecracker isolation
- [ ] Cost monitoring (OpenCost)
- [ ] Automated backups
- [ ] Staging/prod environments

Data Ingestion (0/7)
- [ ] Web crawlers
- [ ] ArXiv/RSS workers
- [ ] Document processing pipeline (Tika)
- [ ] PaddleOCR integration
- [ ] Embedding service
- [ ] Neo4j KG schema
- [ ] Provenance tracking

Notes
- All E2E/test-only hooks must be gated behind NEXT_PUBLIC_E2E_HOOKS.
- Prefer updating this file instead of scattering status across docs or code comments.

Quantum UX & Engine (0/18)
- [ ] Quantum Engine facade: unify Superposition/Entanglement/Tunneling under `app/quantum/engine/*`
- [ ] Superposition visualizer (reuse + shader polish)
- [ ] Tunneling demo (barrier + probability wave)
- [ ] Gravity/curvature field (curvature shader + waves)
- [ ] GPU particle system caps + perf budget (60fps target)
- [ ] WebGL feature-detect + 2D fallback
- [ ] Parallax: intensity flag `NEXT_PUBLIC_QUANTUM_INTENSITY` (in place) + a11y
- [ ] Quantum page stability toggles (Pause/Intensity/⚡ Stabilize) (in place)
- [ ] Education Hub route `/education` with lesson scaffolds
- [ ] Telemetry for demos (page events, lesson progress)
- [ ] Multi-user sync stub (WS channel) for lessons
- [ ] QA checklist for motion sickness + readability
- [ ] Unit tests for engine math helpers
- [ ] E2E: quantum page loads, no tilt/blur loop, controls work
- [ ] Docs: how to add a new demo module
- [ ] Feature flags documented in README
- [ ] Performance profiles across devices
- [ ] Error boundaries for heavy WebGL scenes

Conscious Kernel – Advanced (0/22)
- [ ] Kernel chooser in API (`/api/consciousness/*`, `/api/chat`) based on edition/header
- [ ] Implement `AdvancedPhiCalculator` (combine existing phi + GWT surrogate)
- [ ] Expose phi components (information, integration, …) in stream envelope
- [ ] AttentionSystem scaffold (returns attention_strength, binding_coherence)
- [ ] SalienceEngine scaffold + components breakdown
- [ ] Safety/stability return shape (risk, factors, recs) exposed to UI
- [ ] Ethics evaluator minimal (allow/revise/veto + reasons) wired to chat metadata
- [ ] Episodic memory enrich (store phenomenology JSON when PG available)
- [ ] Tool execution wrapper to compute `consciousness_impact`
- [ ] Right Panel: ensure tabs render extended metadata (already supports JSON)
- [ ] Persist timeline events for attention/phi
- [ ] Add switch to Console to filter Advanced events
- [ ] Unit tests for calculators (deterministic stubs)
- [ ] E2E: stream shows phi + attention; ethics chip renders
- [ ] Perf guardrails (server compute max 50ms per cycle at M0)
- [ ] Feature flags for each module (`ADV_PHI`, `ADV_ATTENTION`, `ADV_ETHICS`)
- [ ] Logging/backoff when compute disabled
- [ ] Telemetry cost/cycle metrics
- [ ] Docs: envelope schema and migration
- [ ] Rollback path to basic kernel
- [ ] Observability dashboards
- [ ] Security review

Voice & Agent Integration (0/9)
- [ ] Voice transport selection: Upload (current), LiveKit/WebRTC (planned)
- [ ] GPT-4o Realtime integration (flagged) with graceful fallback
- [ ] ElevenLabs TTS adapter (flagged)
- [ ] Wakeword (porcupine) + VAD polish
- [ ] Privacy mode (local-only transcription)
- [ ] Voice-guided navigation hooks (quantum lessons)
- [ ] UI mic affordances and safety
- [ ] E2E guarded tests (skip when voice disabled)
- [ ] Docs + keys setup
