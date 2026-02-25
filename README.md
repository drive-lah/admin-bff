# Drivelah Admin BFF (Backend for Frontend)

The Express/TypeScript middleware layer for the Drivelah Admin Portal. Sits between the React frontend (admincontrols) and the Python backend (new-monitor-api). Handles Google OAuth, JWT issuance, route-level auth, and request proxying.

**Live:** `https://admin-bff-ihmy.onrender.com`
**Tech:** Express + TypeScript + Node.js 18
**Port:** 3001
**Deployed on:** Render

---

## Local Setup

```bash
cd admin-bff
npm install
cp .env.example .env   # then fill in values
npm run dev            # Dev server → http://localhost:3001
npm run build && npm start  # Production
```

**Required env vars:**
```
AI_AGENTS_API_URL=https://new-monitor-api-latest.onrender.com   # Backend URL
GOOGLE_CLIENT_ID=...      # Google OAuth app client ID
JWT_SECRET=...            # Secret for signing BFF JWTs
ALLOWED_ORIGINS=http://localhost:5173,...
ADMIN_SECRET=...          # For kill-switch endpoints
```

---

## Route Summary

All routes under `/api/admin/*` require a valid Bearer JWT (issued by this service on Google login).

| Prefix | Proxies to |
|--------|-----------|
| `/api/auth` | Issues JWTs — no auth required |
| `/api/admin/verifications` | new-monitor-api `/api/verifications/*` |
| `/api/admin/kpis` | new-monitor-api `/api/kpis/*` |
| `/api/admin/ai-agents` | new-monitor-api `/api/agents/*` |
| `/api/admin/users` | new-monitor-api `/api/admin/users/*` |
| `/api/admin/finance` | new-monitor-api `/api/finance/*` |
| `/api/health` | Local health check |

---

## Full Documentation

📚 **[Documentation Hub → new-monitor-api/documentation/](../new-monitor-api/documentation/README.md)**

Key docs:
- [System Overview](../new-monitor-api/documentation/README_OVERVIEW.md) — what the admin system does
- [Technical Reference](../new-monitor-api/documentation/README_TECHNICAL.md) — architecture, auth flow, API contracts, patterns
- [Architecture](../new-monitor-api/documentation/ARCHITECTURE.md) — three-tier architecture detail
- [API Reference](../new-monitor-api/documentation/API_REFERENCE.md) — all endpoints
