# Project Brahm – Frontend

A Next.js 14 + TypeScript + Tailwind app with Jest unit tests and Playwright E2E, implementing Brahm chat UI, right panel, and a Futuristic shell. Includes optional microphone capture and upload.

Tasks & Roadmap
- See TASKS_STATUS.md (source of truth for phases and task completion)

Quick start
- Requirements: Node 20+ (tested with v24), npm 10+.
- Install: npm ci
- Dev: npm run dev (default Next port 3000)
- Unit tests: npm run test:ci
- E2E tests: 
  - npm run e2e:install
  - npm run test:e2e (boots dev on port 3020 via Playwright config)

Environment variables
- NEXT_PUBLIC_API_URL: Backend base URL (defaults to http://localhost:8000)
- NEXT_PUBLIC_FUTURISTIC_UI: 'true' to enable Futuristic shell (default 'false')
- NEXT_PUBLIC_E2E_HOOKS: 'true' used in E2E runs via Playwright config
- BRAHM_EDITION: Server edition default for API handlers; 'basic' | 'advanced'. Also used when the edition cookie is absent.
- NEXT_PUBLIC_BRAHM_EDITION: Client default edition for initial CSS class and store hydration; 'basic' | 'advanced'.
- ADVANCED FEATURE FLAGS (documented only; enable as features land):
  - NEXT_PUBLIC_ADV_QUANTUM: 'true' to surface Advanced Quantum modules in UI
  - NEXT_PUBLIC_ADV_AGENT: 'true' to surface Advanced Agent features in UI
  - ADV_TELEMETRY: 'true' to enable additional Advanced telemetry fields server-side

Conscious Kernel + Tools
- Docs: see `docs/conscious/README.md` for module profiles, CIPS UI, and tool guardians
- Kernel tab: Right Panel → “Kernel” shows prediction error, phi weights (legend), qualia, coalitions + quick links
- Tool API: `POST /api/tools/execute` runs registered tools with pre/post safety checks
- NEXT_PUBLIC_VOICE_API_URL: Voice upload endpoint base URL (defaults to `${NEXT_PUBLIC_API_URL}/voice`)
- NEXT_PUBLIC_VOICE_AUTO_SEND: 'true' to automatically send the transcript as a chat message (default 'false')
- NEXT_PUBLIC_CHAT_METADATA_AUTOOPEN: 'true' to auto-open Right Panel tabs on streamed metadata
- NEXT_PUBLIC_PERSIST_REMOTE: 'true' to enable conversations/messages API (dev uses in-memory fallback)
- NEXT_PUBLIC_DEBUG_PANEL: 'true' to enable the floating Telemetry debug panel (shows request logs and metrics). The panel is available in both Classic and Futuristic shells when enabled.
- NEXT_PUBLIC_QUANTUM_ENABLED: 'true' to enable Quantum page effects (default 'true' on the Quantum page).
- NEXT_PUBLIC_QUANTUM_INTENSITY: 'off' | 'low' | 'medium' | 'high' to tune parallax/blur/rotation intensity (default 'low'). Set to 'off' or enable `prefers-reduced-motion` in OS to minimize motion.
- AUTH_SECRET, NEXTAUTH_URL: required for next-auth (Phase 3)
- DATABASE_URL, DATABASE_PROVIDER: required for Prisma (Phase 3)

Voice recording (Phase 2)
- Start/stop with mic button on the chat input row.
- Shows a VU meter while recording; auto-stops after 60s for safety.
- On stop, a webm recording is available for playback and auto-uploaded via multipart/form-data to `${NEXT_PUBLIC_VOICE_API_URL || NEXT_PUBLIC_API_URL + '/voice'}` with fields: file, session_id, model.
- The backend response is parsed for transcript in any of: `transcript`, `text`, `result.transcript`, `data.transcript`, or `alternatives[0].transcript`.
- If `NEXT_PUBLIC_VOICE_AUTO_SEND` is true, the transcript is immediately sent to chat; otherwise it is inserted into the input and can be sent manually.

Tailwind
- content globs include ./app/**/*, ./components/**/*, and ./src/**/*.

Docker
- Multi-stage Dockerfile builds and runs as non-root.

Notes
- Middleware applies simple rate limiting to /api/tools and /api/rpc and requires Bearer token for those routes.
- Middleware also propagates edition to API handlers via X-Brahm-Edition. The edition is resolved from the 'brahm_edition' cookie, then BRAHM_EDITION/NEXT_PUBLIC_BRAHM_EDITION, and can be switched in the UI badge (bottom-right).
- For E2E, avoid hardcoding ports in specs; use relative paths to respect baseURL.

Debug Panel
- Enable by setting `NEXT_PUBLIC_DEBUG_PANEL=true` in your environment (e.g., `.env.local`).
- A Telemetry button appears at bottom-right. Click to open. It captures `telemetry:request` and `telemetry:request-complete` events (emitted by client fetch wrappers) and lets you copy request details.

## Quantum Mode (BrahmAgent)

BrahmAgent is an omnipresent, floating, morphing orb present across all pages. It implements quantum-inspired behaviors and a structured response style.

Features:
- Omnipresent orb(s) with teleport, superposition ghosts, entangled glow phase, idle/dream states, whisper hints
- Chat panel wired to `/api/chat` with streaming and a Stop button
- Highlight-to-Explain toolbar for selections (Explain / Summarize / Key terms)
- Cross-tab coordination via BroadcastChannel; split into multiple orbs
- Memory Keeper: stores episodes (prompt, response, summary, tags) and shows a Lineage viewer
- Ethics Guardian label

Structured Response Format (enforced after streaming completes):
- Parallel States → Collapsed Insight
- Primary Response
- Meta-Reflection (why this answer, confidence score, alternate path not taken)
- Lineage Chain
- Ethical Scan

Settings:
- Open the BrahmAgent panel (click the orb)
- Toggle Quantum Mode
- Click “Settings” to configure:
  - Enforce structure
  - Ethics guardian
  - Memory keeper

Server preamble:
- The `/api/chat` route prepends a system preamble if none is present to encourage the structured style for all clients.

Local development:
- `npm run dev` — start Next.js
- Navigate to any page and interact with the orb

