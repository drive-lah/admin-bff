/**
 * Canonical permission-module + team registry — SINGLE SOURCE OF TRUTH.
 *
 * A "module" is the unit of console access (keycard door). A route gates itself
 * with requireModuleAccess(module, level); a user's user_permissions row grants
 * (module, access_level). This file is the ONLY place module names are defined —
 * the migration seed, dev-login token, and grant path must all reference it.
 *
 * TEAMS is a SEPARATE axis (org chart / department), not permissions. Never share
 * a string between MODULES and TEAMS by accident (see DQ-73: users != user-mgmt).
 *
 * Locked plan: finance-api documentation/STATUS.md § Finance Access Modules.
 */

// ── Access levels ─────────────────────────────────────────────────────────────
// Ordered least→most; index comparison is the check. `own` = row-level self scope
// (see PERSONAL_MODULES) and sits BELOW read.
export const ACCESS_LEVELS = ['own', 'read', 'write', 'admin'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

// ── Kept modules (existing surfaces, unchanged by the finance split) ───────────
export const KEPT_MODULES = [
  'users',           // MARKETPLACE users (hosts/guests) — product admin
  'user-mgmt',       // CONSOLE operators (our team) + their permissions
  'ai-agents',
  'core',
  'tech',
  'listings',
  'transactions',    // MARKETPLACE transactions — NOT the Accounting▸Transactions tab
  'resolution',
  'claims',          // INSURANCE/damage claims (product) — NOT finance.expenses
  'host-management',
  'flexplus',
  'verification',
  'hr',              // HR console (onboard/offboard/employees). Distinct AXIS from the 'hr' TEAM
                     // (org chart) — same string, different check: module = user_permissions row,
                     // team = users.team. Grants live under 'hr'; 0 under 'human-resources'.
] as const;

// ── Finance sub-modules (replace the retired `finance` mega-module) ────────────
// Each maps to a GROUP of FE finance tabs (admincontrols FinanceContainer /
// AccountingModule). See STATUS § Finance Access Modules for the tab mapping.
export const FINANCE_MODULES = [
  'finance.counterparties', // shared, all-rows
  'finance.collections',    // shared, all-rows
  'finance.invoices',       // AP: Accounting▸Invoices + Contracts
  'finance.ledger',         // GL core: entities/COA/bank/txns/JEs/events/recon/TB/rules/amort
  'finance.reports',        // Accounting▸Reports + FP&A (read-oriented)
  'finance.expenses',       // PERSONAL, own-scoped — employee reimbursements + own employee/HR view
  'finance.payroll',        // PERSONAL, own-scoped — salary/CPF/super/income-tax
  'finance.payouts',        // Wise vendor payouts — EXTREMELY RESTRICTED (admin + maker-checker)
  'finance.payment_requests', // guest/host payment requests — TEMP bridge till TMS (ops)
] as const;

// Retired — kept here only so the M5 contraction step can assert it's fully drained.
export const RETIRED_MODULES = ['finance'] as const;

export const MODULES = [...KEPT_MODULES, ...FINANCE_MODULES] as const;
export type Module = (typeof MODULES)[number];

// Modules whose rows are scoped to the caller (owner_user_id === req.user.id)
// unless the caller holds read+ on that module. The ONLY modules where `own` is
// a meaningful grant.
export const PERSONAL_MODULES: readonly Module[] = ['finance.expenses', 'finance.payroll'];

// ── Base modules (implicitly held by EVERY authenticated console user) ─────────
// A base module needs no user_permissions row and no grant — it's part of the
// keycard everyone gets by logging in. Requests (POL-110) is the team's open
// raise/track surface, so finance.payment_requests is base: this makes the tab
// visible to everyone AND (since it's a finance.* module) opens the Finance card
// for non-finance staff, who then see ONLY Requests. Reversible: drop it here.
export const BASE_MODULES: readonly Module[] = ['finance.payment_requests'];
export const isBaseModule = (m: string): boolean =>
  (BASE_MODULES as readonly string[]).includes(m);
/** Union a user's granted modules with the always-on base set (order-stable, deduped). */
export const withBaseModules = (granted: readonly string[]): string[] => {
  const merged = granted.slice();
  for (const m of BASE_MODULES) if (!merged.includes(m)) merged.push(m);
  return merged;
};

// ── Teams (org chart — a DIFFERENT axis from MODULES) ─────────────────────────
// Sourced from admin-bff/src/routes/users.ts validation enum.
export const TEAMS = [
  'tech', 'core', 'resolutions', 'c&s', 'host', 'data', 'hr', 'finance',
  'founders', 'product', 'marketing', 'fleet ops', 'verification', 'guest',
  'flexplus', 'na',
] as const;
export type Team = (typeof TEAMS)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────
export const isModule = (s: string): s is Module => (MODULES as readonly string[]).includes(s);
export const isPersonalModule = (m: string): boolean =>
  (PERSONAL_MODULES as readonly string[]).includes(m);

/** true when userLevel satisfies requiredLevel (admin ≥ write ≥ read ≥ own). */
export const satisfiesLevel = (userLevel: string, requiredLevel: AccessLevel): boolean => {
  const u = ACCESS_LEVELS.indexOf(userLevel as AccessLevel);
  const r = ACCESS_LEVELS.indexOf(requiredLevel);
  return u >= 0 && r >= 0 && u >= r;
};

/**
 * Backward-compat shim for the expand→migrate→contract transition (M3/M5).
 * A legacy `finance` grant is treated as covering every `finance.*` module, so
 * splitting the module never locks out someone who still only holds `finance`.
 * REMOVE after M2 grants are migrated + verified.
 */
export const expandLegacyFinance = (grantedModules: readonly string[]): string[] => {
  if (!grantedModules.includes('finance')) return grantedModules.slice();
  const merged = grantedModules.slice();
  for (const m of FINANCE_MODULES) if (!merged.includes(m)) merged.push(m);
  return merged;
};
