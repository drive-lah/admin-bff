-- ============================================================================
-- M2 — Finance module split: ADDITIVE permission backfill
-- ----------------------------------------------------------------------------
-- Locked plan: finance-api documentation/STATUS.md § Finance Access Modules.
--
-- DO NOT auto-run. This mutates the LIVE shared prod DB (collections-db RDS).
-- Review the preview counts (STEP 0) FIRST, then run STEP 1 + STEP 2 in one
-- transaction. Everything here is ADDITIVE (ON CONFLICT DO NOTHING) — no grant
-- is removed, so it is safe and reversible (rollback = delete the new rows).
--
-- Order matters: run this AFTER the app has booted once on the new code (so the
-- access_level CHECK already includes 'own' — see migrations.ts). The old
-- `finance` grants are left in place; the app's backward-compat shim keeps them
-- working until M5 drops them.
-- ============================================================================

-- ---- STEP 0: PREVIEW (run these SELECTs first; write nothing) ---------------
-- How many holders of the legacy `finance` grant will fan out to finance.*:
--   SELECT count(*) AS finance_admins FROM user_permissions WHERE module = 'finance';
-- How many active users will get the personal `own` grants:
--   SELECT count(*) AS active_users FROM users WHERE status = 'active';
-- Sanity: no finance.* rows should exist yet (fresh split):
--   SELECT module, count(*) FROM user_permissions WHERE module LIKE 'finance.%' GROUP BY module;

BEGIN;

-- ---- STEP 1: fan out each legacy `finance` grant to the 7 finance.* modules --
-- Preserve the holder's level (admin/write/read) and grantor. Old `finance`
-- row is left untouched (shim relies on it until M5).
INSERT INTO user_permissions (user_id, module, access_level, granted_by, granted_at)
SELECT p.user_id, m.module, p.access_level, p.granted_by, CURRENT_TIMESTAMP
FROM user_permissions p
CROSS JOIN (VALUES
  ('finance.counterparties'),
  ('finance.collections'),
  ('finance.invoices'),
  ('finance.ledger'),
  ('finance.reports'),
  ('finance.expenses'),
  ('finance.payroll')
) AS m(module)
WHERE p.module = 'finance'
ON CONFLICT (user_id, module) DO NOTHING;

-- ---- STEP 2: every active user gets self-serve `own` on the personal modules -
-- So each employee can see/file only their OWN expenses + payslip. Users who
-- already hold read+ (finance processors / HR) keep the higher grant (DO NOTHING).
-- granted_by = the system admin. The CTE is a HARD PRECONDITION: if the admin
-- account is absent this INSERT selects zero rows (cross join with an empty CTE)
-- rather than silently self-granting each user their own permission. If STEP 2
-- inserts nothing, the admin account is missing on this instance — fix that first.
WITH admin AS (SELECT id FROM users WHERE email = 'admin@drivelah.sg' LIMIT 1)
INSERT INTO user_permissions (user_id, module, access_level, granted_by, granted_at)
SELECT u.id, m.module, 'own', admin.id, CURRENT_TIMESTAMP
FROM users u
CROSS JOIN admin
CROSS JOIN (VALUES ('finance.expenses'), ('finance.payroll')) AS m(module)
WHERE u.status = 'active'
ON CONFLICT (user_id, module) DO NOTHING;

-- ---- VERIFY (still inside the txn; COMMIT only if these look right) ----------
-- SELECT module, access_level, count(*) FROM user_permissions
--   WHERE module LIKE 'finance%' GROUP BY module, access_level ORDER BY module;

COMMIT;

-- ---- ROLLBACK (if ever needed) ---------------------------------------------
-- Valid ONLY for rolling back THIS migration (before M5). After M5 the
-- `finance.*` rows are the canonical grants — do NOT run this then, it would
-- wipe all live finance permissions. Scope by run time if unsure:
--   DELETE FROM user_permissions WHERE module LIKE 'finance.%' AND granted_at >= '<this-run-timestamp>';
-- DELETE FROM user_permissions WHERE module LIKE 'finance.%';
