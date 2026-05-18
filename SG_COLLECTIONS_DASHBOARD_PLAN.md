# SG Collections — Admin Dashboard Integration Plan (BFF side)

**Status:** Planning. No code changes yet.
**Branch (when work starts):** `feature/sg-collections-proxy` (off `main`).
**Related plans:** `ai-collection-agents/SG_COLLECTIONS_DASHBOARD_PLAN.md`, `admin-controls/SG_COLLECTIONS_DASHBOARD_PLAN.md`.

---

## Why this doc exists

The dashboard FE (`admin-controls`) talks only to this BFF. Today every `/api/admin/ai-agents/*` request is proxied to one upstream (`new-monitor-api`, env `AI_AGENTS_API_URL`). To add the **SG collections agent** (running on `ai-collection-agents`) we need this BFF to know which upstream to call **per agent UUID**.

The new-monitor-api repo is **not changed** in this initiative — SG owns its own metrics endpoint. This BFF becomes the join point.

## What changes

1. **Per-agent upstream registry.** Two axios clients (`auClient` → existing AU monitor; `sgClient` → new SG service). A static `UUID → market` map picks the right one for each request.
2. **Single-page relabel.** `getAgents()` fan-outs to both upstreams, merges results, and rewrites the `name` field for known UUIDs (`AU Collections Agent`, `SG Collections Agent`) so the FE doesn't need to know about renaming. Also stamps a `market` field.
3. **Demo mode (dev only).** New `BFF_DEMO_MODE=true` env. When set, AU and SG clients both return canned fixtures from a local module — no upstreams are called. Boots the FE end-to-end without any backend creds.
4. **Dev auth bypass.** When `NODE_ENV !== 'production'` AND `BFF_DEV_AUTH_BYPASS=true`, the auth middleware skips Google OAuth and issues a stub JWT for `dev@localhost`. Hard-gated so it cannot ship to prod.

Routes (`src/routes/ai-agents.ts`) are **unchanged** — all proxy through `aiAgentsClient` which now knows the registry.

## File-by-file changes

**Edits**

- `src/config/config.ts`:
  - Add `sgCollectionsApiUrl: process.env.SG_COLLECTIONS_API_URL || 'http://localhost:3000'`
  - Add `demoMode: process.env.BFF_DEMO_MODE === 'true'`
  - Add `devAuthBypass: process.env.NODE_ENV !== 'production' && process.env.BFF_DEV_AUTH_BYPASS === 'true'`
  - Append `SG_COLLECTIONS_API_URL` to `requiredEnvVars` for `production` only.
- `src/services/ai-agents-client.ts`:
  - Replace single `this.client` with `auClient` + `sgClient`.
  - Add module-level `AGENT_MARKET: Map<string, 'AU' | 'SG'>` keyed on the four existing AU UUIDs + the new `SG_COLLECTIONS_AGENT_UUID`.
  - Add `private upstreamFor(id: string)` that returns the right client.
  - Every per-agent method (`getAgent`, `getAgentAnalytics`, `getAgentLogs`, `getAgentActions`, `performAgentAction`, evaluations methods) calls `this.upstreamFor(id).get(...)`.
  - `getAgents()` does `Promise.allSettled` on `[auClient, sgClient]`, merges, applies a `RENAME` map (`AU Collections Agent` / `SG Collections Agent`), stamps `market` from the registry, returns `{agents, errors}` shape (FE shows a non-blocking warning if one upstream is down).
  - In `demoMode`, every method short-circuits to fixtures from a new file (see below).
- `src/middleware/auth.ts` (or `auth-enhanced.ts`):
  - At the top of the middleware, if `config.devAuthBypass`, attach `req.user = { email: 'dev@localhost', role: 'admin', ... }` and call `next()`.
  - Add a startup log line warning when bypass is on.
- `src/server.ts`:
  - No structural changes. Optional: log `demoMode` and `devAuthBypass` at startup so they're visible.
- `.env.example`:
  ```
  SG_COLLECTIONS_API_URL=http://localhost:3000
  BFF_DEMO_MODE=true              # dev only
  BFF_DEV_AUTH_BYPASS=true        # dev only — gated by NODE_ENV
  ```
- `render.yaml`:
  - Add `SG_COLLECTIONS_API_URL` (sync: false).
  - Do NOT add `BFF_DEMO_MODE` or `BFF_DEV_AUTH_BYPASS` to prod env.

**New files**

- `src/services/demo-fixtures.ts` — canned `Agent[]`, analytics envelope, logs, actions. Mirrors AU collections shape exactly. Returned by `ai-agents-client.ts` when `demoMode` is true.

## Agent UUID registry

The four existing AU UUIDs live in `src/services/ai-agents-client.ts`. We add one more:

```ts
export const AGENT_MARKET = new Map<string, "AU" | "SG">([
  ["a19c35a3-f2ab-532f-a493-64a5fe9e88ff", "AU"], // collections
  ["1986da29-e8b8-5f55-b51e-e6181fd37c94", "AU"], // chat
  ["f8e9d3a5-4b6c-4d8e-9f2a-1c3d5e7f9b1a", "AU"], // listing
  ["ae9486f7-688b-4278-bae9-541751ce2b5c", "AU"], // verification
  ["<SG_UUID>", "SG"], // SG collections
]);
export const RENAME = new Map<string, string>([
  ["a19c35a3-f2ab-532f-a493-64a5fe9e88ff", "AU Collections Agent"],
  ["<SG_UUID>", "SG Collections Agent"],
]);
```

The SG UUID is generated once and **the same string** is committed in:

- `ai-collection-agents-main/apps/api/src/monitor/types.ts`
- `admin-controls-main/src/features/ai-agents/components/AgentDetailView.tsx`
- this file (above).

## Failure modes

- **One upstream down.** `getAgents()` returns the live half + an `errors[]` array. The FE logs but doesn't fail.
- **SG UUID not in registry.** Defaults to AU upstream (safe — request returns 404 from monitor-api rather than crashing the BFF).
- **Demo mode in prod.** Boot-time check: refuse to start if `NODE_ENV === 'production' && demoMode`. Same for `devAuthBypass`.

## Branch hygiene

```bash
git checkout main
git pull
git checkout -b feature/sg-collections-proxy
```

Depends on `ai-collection-agents-main` having shipped its `feature/sg-collections-monitor-api` (or at least exposed the new routes locally) before BFF can be exercised end-to-end. In demo mode it can be developed and tested independently.

## Local run (post-implementation)

```bash
# Demo mode — no upstream creds needed
BFF_DEMO_MODE=true \
BFF_DEV_AUTH_BYPASS=true \
npm run dev                        # → http://localhost:3001

# Live mode
AI_AGENTS_API_URL=https://new-monitor-api-1.onrender.com \
SG_COLLECTIONS_API_URL=http://localhost:3000 \
npm run dev
```
