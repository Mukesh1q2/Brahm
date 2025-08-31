# Backend Persistence RFC (Option B)

Status: Draft
Owner: <your-name>

Goal
Provide a simple, robust conversation persistence layer with auth, multi-device sync, and offline-first behavior that complements localStorage and scales to server truth.

Defaults (PR-7)
- Auth: next-auth with JWT session strategy (pluggable OAuth providers later)
- DB/Storage: Prisma + Postgres (SQLite in dev)
- API hosting: Next.js API routes (in this repo)
- Flags: NEXT_PUBLIC_PERSIST_REMOTE=true enables sync client & endpoints
- Retention: 30-day soft cap on large metadata blobs; configurable hard cap per conversation
- Telemetry: no message content; IDs/sizes/latency/token counts only
- Encryption: add encryptedAtRest=true flag for forward-compatible server KMS/Vault integration

Scope
- Persist conversations, messages, and metadata associated to a user.
- Support offline creation in localStorage; sync when online/authenticated.
- Keep frontend flexible to stream metadata (reasoning/diffs) in-flight without blocking persistence.

Non-goals
- Realtime multi-user collaboration (out-of-scope for initial cut).
- CRDT-based merge (we can evolve to CRDT later if needed).

Auth
- Options: Clerk, Auth0, next-auth with JWT (choose one for DX + pricing + maturity).
- JWT conveys userId; APIs require Authorization: Bearer <token>.
- For dev: fallback to anonymous local mode if token missing.

Data model (initial)
- conversations
  - id (uuid)
  - userId (string)
  - title (string)
  - createdAt (timestamp)
  - updatedAt (timestamp)
- messages
  - id (uuid)
  - conversationId (uuid)
  - role ("user" | "assistant" | "system")
  - content (text)
  - createdAt (timestamp)
  - updatedAt (timestamp)
  - meta (jsonb) // optional, e.g. tool calls
- metadata_blobs (optional, or inline on messages.meta)
  - id (uuid)
  - conversationId (uuid)
  - messageId (uuid, nullable)
  - kind ("reasoning" | "diff" | "json" | "other")
  - payload (json / text)
  - createdAt (timestamp)

Storage considerations
- Compression: For larger payloads (diffs, traces), consider gzip deflate on transport; DB stores plain JSON/text for queryability initially.
- Quotas: soft caps per user; telemetry to track storage usage.

Sync strategy
- Offline-first: localStorage holds the working set.
- On auth:
  - Upload new conversations/messages (created locally) to server.
  - Download server changes since lastSyncTs.
  - Conflict policy: last-write-wins (LWW) using updatedAt; mark conflicts for review in a debug panel if needed.
- IDs:
  - Client generates UUIDs; server preserves to avoid mapping tables.

API sketch (server)
- GET /api/conversations?since=ts -> { items: [{ id, title, updatedAt, ... }] }
- POST /api/conversations { id, title, createdAt, updatedAt } -> { ok: true, item }
- GET /api/messages?conversationId=...&since=ts -> { items: [...] }
- POST /api/messages { id, conversationId, role, content, createdAt } -> { ok: true, item }
- Optional: /api/metadata for large payloads.

Frontend integration
- Gate behind NEXT_PUBLIC_PERSIST_REMOTE=true.
- Sync orchestrator hooks into chat store transitions (new conversation, new message, rename, delete).
- Use fetch with ModelContext interceptors to collect timing/trace for telemetry.
- Initial client: app/_lib/syncClient.ts (LWW, queue in Phase 2)

Security
- Enforce per-user row-level security via userId from JWT.
- Avoid logging message content in telemetry by default; optional redaction.

Open questions
- Do we need a soft-delete model (deletedAt) for recoverability?
- Should we version messages to support future merges?
- For diffs, store full text or structured patches?

Milestones
- PR-7a: Auth scaffolding + client token plumbing
- PR-7b: Minimal conversations/messages endpoints + frontend sync hooks
- PR-7c: Metadata blobs support + quotas + telemetry

Appendix
- Future: CRDT (Automerge/Yjs) if collaboration becomes a target.
- Future: Export/import for user data portability.

