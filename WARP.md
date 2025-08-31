# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Next.js 14 + TypeScript + Tailwind frontend with Jest unit tests and Playwright E2E. Key UI areas: chat, console, agents dev; key server routes under app/api. State via Zustand. Streaming + telemetry utilities included.

Common commands
- Install deps
  - npm ci
- Dev server (Next.js)
  - npm run dev
  - Default port: 3000 (E2E overrides to 3020)
- Build and start (production)
  - npm run build
  - npm run start
- Lint
  - npm run lint
- Type check
  - npm run typecheck
- Unit tests (Jest)
  - Run all: npm run test
  - CI mode: npm run test:ci
  - Watch: npm run test:watch
  - Single file: npm run test -- tests/unit/sync-client.test.ts
  - By name pattern: npm run test -- -t "disabled client no-ops"
- E2E tests (Playwright)
  - Install browsers once: npm run e2e:install
  - Run all: npm run test:e2e
  - Headed: npm run test:e2e:headed
  - UI mode: npm run test:e2e:ui
  - Debug: npm run test:e2e:debug
  - Single spec: npm run test:e2e -- tests/e2e/your.spec.ts
  - By title grep: npm run test:e2e -- -g "title substring"
- Docker
  - Build: docker build -t brahm-frontend .
  - Run: docker run -p 3000:3000 brahm-frontend

Quickstart
- Start dev server: npm run dev
- Open chat UI after the server is ready (choose one):
  - macOS: open http://localhost:3000/chat
  - Windows (PowerShell): Start-Process "http://localhost:3000/chat"
  - Linux: xdg-open http://localhost:3000/chat

Environment
- NEXT_PUBLIC_API_URL: Backend base URL (defaults to http://localhost:8000)
- NEXT_PUBLIC_FUTURISTIC_UI: 'true' to enable Futuristic shell UI (default 'false')
- NEXT_PUBLIC_E2E_HOOKS: 'true' during E2E (set by Playwright config)
- NEXT_PUBLIC_VOICE_API_URL: Voice upload base (defaults to ${NEXT_PUBLIC_API_URL}/voice)
- NEXT_PUBLIC_VOICE_AUTO_SEND: 'true' to auto-send transcript to chat
- Note: Console page also checks NEXT_PUBLIC_API_BASE (falls back to NEXT_PUBLIC_API_URL)

Environment variables by scope
- Frontend (public)
  - NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_BASE
  - NEXT_PUBLIC_FUTURISTIC_UI, NEXT_PUBLIC_GLOBAL_MODEL_SELECTOR
  - NEXT_PUBLIC_E2E_HOOKS, NEXT_PUBLIC_DEBUG_PANEL, NEXT_PUBLIC_TELEMETRY_INGEST
  - NEXT_PUBLIC_VOICE_API_URL, NEXT_PUBLIC_VOICE_AUTO_SEND
- Server (private) — planned for backend persistence
  - Example: AUTH_SECRET, DATABASE_URL (Prisma/Postgres), NEXTAUTH_URL (for next-auth)
  - These are not required for the current frontend-only workflows but may be introduced alongside persistence endpoints

High-level architecture
- Framework & routing (Next.js App Router)
  - UI routes under app/, API handlers under app/api/.../route.ts.
  - Representative UI pages include chat/, console/, agents/dev/.
  - API namespaces include chat (streamed text with metadata envelopes), agents (SSE stream and run endpoints), audit (logs/query), files (upload), tools (execute), rpc, mcp, prs, and auth.

|- Streaming envelopes for AI metadata
- Conscious Kernel SSE controls (UI)
  - In the Right Panel (Futuristic UI), above the Stream Run button you can set:
    - enableEthics, enableTools, enableSalience (booleans)
    - targetPhi (threshold for conscious_access)
    - steps (number of iterations)
    - seed (optional)
  - These feed /api/agents/stream as query params. Example:
    /api/agents/stream?goal=Debug&steps=6&targetPhi=3.0&enableEthics=true&enableTools=true&enableSalience=true&seed=123&weightGwt=0.5&weightCausal=0.3&weightPp=0.2
  - app/api/chat/route.ts streams text and newline-delimited JSON lines (metadata envelopes) within the same response.
  - Phi weights: You can adjust the per-module weights for the WeightedPhiCalculator using these additional params:
    - weightGwt (default 0.5)
    - weightCausal (default 0.3)
    - weightPp (default 0.2)
  - app/_lib/envelope.ts provides createEnvelopeParser(onMetadata) to parse these lines and surface metadata such as reasoning, diffs, and which right-panel tab to focus. Any consumer of streamed chat can push chunks into this parser to react to metadata without breaking plain-text rendering.

- Telemetry and request tracing
  - app/_lib/api.ts (sendChat) wraps fetch to /api/chat, measures client latency, extracts response model/cost headers, and dispatches window events:
    - 'telemetry:request' on request start/headers with detail = { trace, url, ok, status, clientLatencyMs, serverLatencyMs?, costUsd?, requestModel?, responseModel?, app }
    - 'telemetry:request-complete' on non-OK completion
  - app/console/page.tsx listens to 'telemetry:request' to build a session-only live telemetry table and per-model aggregates. This same pattern can be reused to instrument other client fetches.

- State management (Zustand)
  - Chat store (app/_stores/chatStore.ts): localStorage-persisted conversations/messages; utilities to create chats, push messages, replace last assistant message, rename, and delete.
  - Right panel state (src/store/rightPanelStore.ts, src/store/rightPanelData.ts): drives the inspector tabs (summary/trace/json/diff/memory) and the current run selection; persisted tab key in localStorage.
  - Agent event bus (src/store/agentEventBus.ts + src/lib/agentEvents.ts): lightweight in-memory bus for AgentEvent types (run:start/end, trace, patch). UI components can subscribe to render traces and diffs.

- Agents development & SSE
  - Right Panel “Experiences” tab lists recent episodes. Use the Source selector to switch between Database and In-memory even when DB is configured. Refresh button reloads.
  - app/agents/dev/page.tsx uses EventSource to consume /api/agents/stream?goal=...&steps=..., showing raw JSON events to aid development.
  - docs/conscious/README.md outlines a phased “Conscious Kernel” concept; concrete TypeScript types reside in src/types/Conscious.ts. The docs map planned modules and endpoints used by Agents UI and Right Panel.

- Security & middleware
  - middleware.ts applies a simple per-minute in-memory rate limit and requires Bearer auth for /api/tools and /api/rpc. It also returns x-rate-limit and x-rate-remaining headers on requests. When calling these routes (manually or in tests), include Authorization: Bearer {{token}}.
  - Telemetry debug panel: enable with NEXT_PUBLIC_DEBUG_PANEL=true. Toggle via Command Palette (Toggle Debug Panel) or the floating Telemetry button.

- Styling & build
  - Tailwind configured via tailwind.config.js; content globs include app/**/*, components/**/*, and src/**/*; PostCSS via postcss.config.js.
  - Dockerfile uses multi-stage build (deps → builder → non-root runner) and serves Next on port 3000.

- Testing strategy
  - Unit: Jest + ts-jest + jsdom. setupFilesAfterEnv runs tests/setupTests.js to polyfill fetch, aligning with client fetch instrumentation. Jest maps @/ to src/ via moduleNameMapper.
  - E2E: Playwright config starts the dev server with env overrides (PORT=3020, NEXT_PUBLIC_FUTURISTIC_UI/E2E_HOOKS=true). Specs should use relative paths; do not hardcode ports—respect baseURL.

- TypeScript & module resolution
  - tsconfig.json sets baseUrl "." with a path alias @/* → src/*.
  - Jest mirrors this alias. Prefer @/ imports for code under src/.

Repo conventions
- Commit messages: Conventional Commits. Use types like feat, fix, chore, docs, refactor, test, ci with an optional scope, e.g., feat(chat): support streamed envelopes in UI.
- Branch naming: pr-<id>-<slug> (e.g., pr-123-chat-streaming). For long-running work, feature/<slug> is acceptable prior to opening a PR.
- Merge policy: prefer Squash and merge to keep main linear and ensure a clean history with a single, well-scoped message.

PR/CI workflow
- Required to merge (run in CI or locally before requesting review):
  - npm run lint
  - npm run test:ci
  - npm run test:e2e
- If CI is configured (e.g., GitHub Actions), ensure these jobs run on pull_request. If not, run them locally and include results in the PR description.

Notes pulled from README.md

Database experiences setup (Prisma)
- This project can optionally persist "experiences" to a database via Prisma.
- Required env vars (server runtime):
  - DATABASE_URL — e.g., postgresql://user:pass@localhost:5432/db?schema=public
  - DATABASE_PROVIDER — one of postgres | mysql | sqlite (used by code paths to detect DB availability)
- Typical workflow:
  - npx prisma init (first time)
  - npx prisma migrate dev --name init
  - npx prisma generate
  - npx prisma db push (optional, when syncing schema without a migration)
- Ensure your .env contains DATABASE_URL before running the above. In CI, provide these as secrets.
- When configured, the Experiences tab can read from /api/experiences and the kernel will try to POST new experiences.
- Requirements: Node 20+, npm 10+.
- E2E guidance: avoid hardcoding ports in specs; use relative paths so Playwright baseURL applies.
- Voice recording (Phase 2) logic is described; when enabled (env toggles), uploads a webm to voice API and can auto-send transcript.

Key entry points (UI)
- app/chat/page.tsx: Chat UI (streams assistant output; integrates with Right Panel via envelopes).
- app/console/page.tsx: Self-Evolving Console with audit filters and a live telemetry panel.
  - app/console/auto-prs/page.tsx and app/console/timeline/page.tsx provide additional console views.
- app/agents/dev/page.tsx: SSE tester for the Agents stream endpoint (start/stop and inspect raw events).
- app/terminal/page.tsx, app/editor/page.tsx, app/canvas/page.tsx, app/panini/page.tsx: Additional UIs present in this repo.

Server API surface (app/api)
- /api/chat (POST): Streams text with interleaved metadata envelopes (see Envelope metadata below).
- /api/agents: events/, memory/, org/, run/, stream/.
- /api/experiences: list and insert kernel experiences
- /api/audit: logs/, query/.
- /api/console: events/.
- /api/files: upload/.
- /api/tools: execute/ (protected by middleware auth + rate limiting).
- /api/rpc (protected by middleware auth + rate limiting).
- /api/mcp: run/.
- /api/prs.
- /api/auth: login/ and [...nextauth]/.

End-to-end data flow (typical)
- Chat
  - UI sends messages → app/_lib/api.ts sendChat() → POST /api/chat.
  - Server responds with a text stream that includes newline-delimited JSON envelopes.
  - app/_lib/envelope.ts parses envelopes and emits metadata (reasoning, diff, tab) for the UI/Right Panel.
- Console
  - UI builds URLSearchParams → fetches `${NEXT_PUBLIC_API_BASE || NEXT_PUBLIC_API_URL}/audit/query`.
  - On response, headers are inspected and a 'telemetry:request' event is dispatched; the live telemetry table aggregates per-model stats.

Envelope metadata quick reference
- Envelopes are newline-delimited JSON objects embedded in a text stream; only lines that parse as JSON objects with { type: "metadata", ... } are handled.
- Recognized fields (see app/_lib/envelope.ts and app/api/chat/route.ts):
  - reasoning: free-form string or JSON object describing analysis.
  - diff: either an object { original?: string; modified: string; language?: string } or a string.
  - tab: one of 'summary' | 'trace' | 'json' | 'diff' | 'memory' to suggest which inspector tab to focus.

Model selection context
- app/_components/ModelContext.tsx provides model options and the active model.
- Consumers like app/console/page.tsx use setModel and include the model in request headers (e.g., 'X-Model').

Optional remote sync client
- app/_lib/syncClient.ts can upsert/list conversations and messages against `${base}/api/conversations` and `${base}/api/messages` when enabled. Ensure corresponding backend endpoints exist if enabling remote persistence.

Backend persistence (Phase 2 — placeholder)
- The planned persistence layer introduces: next-auth (JWT), Prisma/Postgres, and REST endpoints under /api/conversations and /api/messages.
- This frontend already includes types and hooks that can integrate with those endpoints once available. See docs/backend-persistence-rfc.md for the roadmap.

Alignment with Brahm AI goals
- Telemetry → meta-cognition: Client-side telemetry and envelopes enable introspection, letting the system observe its own behavior and costs per model.
- Persistence → memory: Phase 2 persistence turns ephemeral chat into durable memory (conversations/messages), enabling continuity and learning.
- Agents → executive function: The Agents SSE flow and event bus model higher-level planning and evaluation, bridging UI and kernel decisions.
- Right Panel → conscious access: The inspector tabs (summary/trace/json/diff/memory) expose internal state in a human-aligned way for oversight and iteration.

