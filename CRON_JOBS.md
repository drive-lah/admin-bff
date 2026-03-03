# Cron Jobs - Admin BFF

## Overview

The admin-bff has scheduled jobs that run on Render to keep user data synchronized with Google Workspace.

---

## Google Workspace Sync Cron Job

### Configuration

- **Service**: Render Cron Job (configured in Render dashboard)
- **Frequency**: Every 2 hours
- **Command**: `npm run sync-google`
- **Purpose**: Synchronize users from Google Workspace to the database

### What It Does

1. **Fetches users from Google Workspace** (all configured domains):
   - drivelah.sg
   - drivemate.au
   - drivemate.nz

2. **Syncs to database**:
   - Inserts new users not yet in database
   - Updates existing users with latest Google data (name, status, org unit, photo, last login)
   - **Marks users as deleted** if they exist in database but not in Google Workspace

3. **Soft Delete Handling**:
   - Users removed from Google are marked with `status = 'deleted'`
   - `deleted_at` timestamp recorded for compliance audit trail
   - All user data preserved (no hard delete)
   - Deleted users excluded from active queries automatically

### Output

The sync job logs:
```
✅ Inserted new users: X
🔄 Updated existing users: Y
🗑️  Marked as deleted: Z
❌ Failed: N users

📊 Total users in database: M
   Active: A
   Suspended: S
   Deleted: D
```

### Logs Location

Check Render's service logs for the admin-bff to see cron job execution:
- Render Dashboard → Services → drivelah-admin-bff → Logs
- Look for: "User synced from Google Workspace"
- Look for: "🗑️  Marked as deleted:"

### Troubleshooting

**If sync is not working:**

1. Check Render logs for errors
2. Verify Google Service Account credentials are valid
3. Verify Google domain-wide delegation is configured
4. Check network connectivity to Google APIs

**If users aren't being marked as deleted:**

1. Run manual sync: `npm run sync-google`
2. Check output for deletion count: `🗑️  Marked as deleted:`
3. If count is 0, verify user is actually missing from Google

**To manually run the sync:**

```bash
npm run sync-google
```

This executes: `node --max-old-space-size=2048 -r ts-node/register scripts/sync-from-google.ts`

---

## Related Documentation

- **Sync Script**: `scripts/sync-from-google.ts` (implementation)
- **Check Script**: `scripts/check-google-sync.ts` (validation)
- **Database Schema**: `SCHEMA_UPDATES.md` (users table soft-delete)
- **Technical Reference**: `/new-monitor-api/documentation/README_TECHNICAL.md`

---

## Implementation Details

### Sync Logic

The sync script:

1. Fetches ALL users from Google Workspace domains
2. Compares with database users
3. **Marks users as deleted if they are in DB but NOT in Google response**

Key code:
```typescript
// Build set of ALL users returned by Google
const googleEmails = new Set(allGoogleUsers.map(u => u.primaryEmail));

// Get all DB users not already marked deleted
const allDbUsers = await pool.query('SELECT email FROM users WHERE status != "deleted"');

// Find users to delete (in DB but not in Google)
const deletedUsers = allDbUsers.filter(u => !googleEmails.has(u.email));

// Mark as deleted with timestamp
for (const user of deletedUsers) {
  UPDATE