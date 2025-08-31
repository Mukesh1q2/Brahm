# Vault Integration (Frontend Plan)

This repo is a Next.js frontend. Secrets must not be fetched directly from the browser.

Approach
- Access Vault server-side only (API routes or server components).
- Expose narrowly-scoped values to the client when absolutely necessary, never raw secrets.

Env schema
- VAULT_ADDR: Vault base URL
- VAULT_NAMESPACE: optional
- VAULT_TOKEN: ephemeral server-only token (dev-only; production should use a short-lived approle/jwt flow)
- VAULT_KV_PATH: base path for KV secrets (e.g., kv/projects/brahm)

Server-side helper (proposed)
- Create a server-only file (e.g., app/api/_utils/vault.ts) that wraps GET/PUT of Vault KV v2.
- Validate that VAULT_* env vars are present server-side; never import that module from client components.
- Add caching/TTL if needed to reduce read frequency.

Secrets flow
- For features that require credentials (e.g., Whisper API key), call a server API route that reads from Vault and proxies the external request.
- Return only the result payload to the client, never the secret.

Row-level permissions (stubs)
- Attach user identity on every API request via a signed cookie/session.
- Server-side, enforce row-level predicates (owner_id == session.user.id) when querying DB.

Policy audit logs
- Add server API route /api/policy/log to ingest structured policy decisions/events. Persist to DB or logging sink.

Security checklist
- [ ] Ensure NEXTAUTH or equivalent is set up to attach user identity.
- [ ] Confirm no secret-bearing code executes on client-side.
- [ ] Add zod or equivalent validation on server route inputs.
- [ ] Centralize outbound calls to external APIs in server routes so secrets are not exposed.

