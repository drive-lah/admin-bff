# User Management Schema Updates

## Summary of Changes

This document outlines the updates made to the user management system based on the requirements.

---

## 1. Users Table Schema Changes

### Updated Fields

#### **Removed Fields**
- `google_groups` - No longer storing Google Groups data in the database

#### **Modified Fields**
- **`role`**: Changed from `('admin', 'manager', 'viewer')` to `('admin', 'viewer')`
  - Removed 'manager' role - permissions are now handled via module-based access

- **`team`**: Migrated to **`teams`** (array type) with predefined constraint checking
  - **Type Changed:** From `VARCHAR(100)` to `TEXT[]` (PostgreSQL array)
  - **Allowed values:** `'tech', 'core', 'resolutions', 'c&s', 'host', 'data', 'hr', 'finance', 'founders', 'product', 'marketing', 'fleet ops', 'verification', 'guest', 'flexplus', 'na'`
  - **Users can now belong to multiple teams**
  - Previously: Single string value, any value allowed

#### **New Fields Added**
| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| `address` | TEXT | User's physical address | Yes |
| `country` | VARCHAR(100) | User's country | Yes |
| `date_of_joining` | DATE | Date when user joined the company | Yes |
| `org_role` | TEXT | User's organizational role/title (e.g., "Senior Engineer", "Finance Manager") | Yes |
| `manager_id` | INTEGER | Employee ID of the user's manager (Foreign Key to users.id) | Yes |
| `phone_number` | VARCHAR(50) | User's contact phone number | Yes |

### Complete Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'viewer')),
  teams TEXT[] NOT NULL CHECK (teams <@ ARRAY['tech', 'core', 'resolutions', 'c&s', 'host', 'data', 'hr', 'finance', 'founders', 'product', 'marketing', 'fleet ops', 'verification', 'guest', 'flexplus', 'na']::TEXT[]),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  region VARCHAR(50) DEFAULT 'global' CHECK (region IN ('singapore', 'australia', 'global')),
  google_workspace_id VARCHAR(255) UNIQUE,
  google_org_unit VARCHAR(255),
  intercom_id VARCHAR(255),
  aircall_id VARCHAR(255),
  slack_id VARCHAR(255),
  profile_photo_url TEXT,
  address TEXT,
  country VARCHAR(100),
  date_of_joining DATE,
  org_role TEXT,
  manager_id INTEGER,
  phone_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  last_google_sync_at TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### New Indexes

```sql
CREATE INDEX idx_users_teams ON users USING GIN(teams);  -- GIN index for array queries
CREATE INDEX idx_users_manager_id ON users(manager_id);
```

---

## 2. Team Definitions

The system now supports **16 predefined teams**:

| Team Code | Frontend Label | Description |
|-----------|----------------|-------------|
| `tech` | Tech | Technology/Engineering team |
| `core` | Core | Core operations team |
| `resolutions` | Resolutions | Dispute resolution team |
| `c&s` | Claims & Security | Claims and Security team |
| `host` | Host | Host management team |
| `data` | Data | Data analytics team |
| `hr` | HR | Human Resources team |
| `finance` | Finance | Finance team |
| `founders` | Founders | Company founders |
| `product` | Product | Product management team |
| `marketing` | Marketing | Marketing team |
| `fleet ops` | Fleet Ops | Fleet operations team |
| `verification` | Verification | User/host verification team |
| `guest` | Guest | Guest/temporary access team |
| `flexplus` | FlexPlus | FlexPlus program team |
| `na` | Not Applicable | Not applicable / Other |

**Note:** Users can now belong to **multiple teams** simultaneously. Teams are stored as a PostgreSQL `TEXT[]` array in the database.

---

## 3. Google Workspace Mapping Updates

### Org Unit to Team Mapping

Updated in `src/services/google-workspace.ts`:

```typescript
const orgUnitMapping = {
  '/Finance': 'finance',
  '/Technology': 'tech',
  '/Tech': 'tech',
  '/Core': 'core',
  '/Resolutions': 'resolutions',
  '/Customer Success': 'c&s',
  '/C&S': 'c&s',
  '/Host': 'host',
  '/Host Management': 'host',
  '/Data': 'data',
  '/HR': 'hr',
  '/Human Resources': 'hr',
  '/Founders': 'founders',
  '/Product': 'product'
};
// Default: 'na'
```

### Role Determination

```typescript
// Google groups that grant admin role
const adminGroups = [
  'admin-super@drivelah.sg',
  'admin@drivelah.sg',
  'admins@drivelah.sg'
];
// Default role: 'viewer'
```

---

## 4. TypeScript Type Updates

### Updated Types in `src/types/user.ts`

```typescript
export type UserRole = 'admin' | 'viewer';

export type UserTeam =
  | 'tech'
  | 'core'
  | 'resolutions'
  | 'c&s'
  | 'host'
  | 'data'
  | 'hr'
  | 'finance'
  | 'founders'
  | 'product'
  | 'marketing'
  | 'fleet ops'
  | 'verification'
  | 'guest'
  | 'flexplus'
  | 'na';

export type UserRegion = 'singapore' | 'australia' | 'global';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  teams: UserTeam[];  // Changed from team to teams (array)
  status: 'active' | 'inactive' | 'suspended';
  region: UserRegion;
  google_workspace_id?: string;
  google_org_unit?: string;
  intercom_id?: string;
  aircall_id?: string;
  slack_id?: string;
  profile_photo_url?: string;
  address?: string;
  country?: string;
  date_of_joining?: string;
  org_role?: string;
  manager_id?: number;
  phone_number?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  last_google_sync_at?: string;
}
```

---

## 5. API Validation Updates

### Create User Schema

```typescript
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'viewer').required(),
  teams: Joi.array().items(
    Joi.string().valid('tech', 'core', 'resolutions', 'c&s', 'host', 'data', 'hr', 'finance', 'founders', 'product', 'marketing', 'fleet ops', 'verification', 'guest', 'flexplus', 'na')
  ).min(1).required(),  // Array of teams, at least 1 required
  region: Joi.string().valid('singapore', 'australia', 'global').optional(),
  google_workspace_id: Joi.string().optional(),
  intercom_id: Joi.string().optional(),
  aircall_id: Joi.string().optional(),
  slack_id: Joi.string().optional(),
  address: Joi.string().optional(),
  country: Joi.string().max(100).optional(),
  date_of_joining: Joi.date().iso().optional(),
  org_role: Joi.string().optional(),
  manager_id: Joi.number().integer().positive().optional(),
  phone_number: Joi.string().max(50).optional()
});
```

### Update User Schema

All new fields are optional in updates and support empty strings or null values for clearing data.

---

## 6. Database Migration Strategy

### For Existing Databases

If you have an existing database with users:

#### Option 1: Soft Migration (Recommended)
```sql
-- Add new columns (they will be NULL for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_joining DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_role TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_manager
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add new indexes
CREATE INDEX idx_users_team ON users(team);
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- Update team constraint (requires updating existing data first)
-- First, ensure all existing teams match new values
UPDATE users SET team = 'na' WHERE team NOT IN ('tech', 'core', 'resolutions', 'c&s', 'host', 'data', 'hr', 'finance', 'founders', 'product', 'na');

-- Drop old role constraint and add new one
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'viewer'));

-- Drop old team constraint and add new one
ALTER TABLE users DROP CONSTRAINT users_team_check;
ALTER TABLE users ADD CONSTRAINT users_team_check
  CHECK (team IN ('tech', 'core', 'resolutions', 'c&s', 'host', 'data', 'hr', 'finance', 'founders', 'product', 'na'));
```

#### Option 2: Fresh Start (For Development)
```bash
# Drop and recreate tables
# WARNING: This will delete all existing user data!
npm run migrate:fresh
```

---

## 7. Permission Management

### How Permissions Work

**Permissions are managed separately from roles:**
- **User Role** (`admin` / `viewer`): Basic access level
- **Module Permissions**: Granular access control per module

### Permission Levels
- `read`: View-only access
- `write`: View and edit access
- `admin`: Full control including user management within module

### Managing Permissions

See [PERMISSION_MANAGEMENT.md](./PERMISSION_MANAGEMENT.md) for complete details.

**Quick Example:**
```bash
# Grant finance module write access to a user
POST /api/admin/users/5/permissions
{
  "module": "finance",
  "access_level": "write"
}

# Revoke permission
DELETE /api/admin/users/5/permissions/finance
```

### Permission Assignment Strategy

**Primary Method: Manual Assignment**
- Recommended for production
- Explicit permission grants via admin portal
- Full audit trail

**Optional Method: Google Groups Sync**
- Can be enabled for automation
- Currently disabled by default
- Would sync permissions based on Google Workspace group membership

---

## 8. Frontend Updates Needed

The admincontrols frontend will need updates to support new fields:

### Components to Update
1. **UserDetailModal**: Display new fields (address, country, etc.)
2. **UserList**: Add columns for org_role, manager
3. **CreateUserForm**: Add input fields for new attributes
4. **UpdateUserForm**: Support editing new fields

### Example Frontend Update
```typescript
// admincontrols/src/features/admin-management/types/adminUser.ts
export interface AdminUser {
  // ... existing fields
  address?: string;
  country?: string;
  date_of_joining?: string;
  org_role?: string;
  manager_id?: number;
  phone_number?: string;
}
```

---

## 9. Testing Checklist

- [ ] Create user with new fields
- [ ] Update user with new fields
- [ ] Set manager_id to another user
- [ ] Verify foreign key constraint works
- [ ] Test team constraint with invalid value
- [ ] Test role constraint with 'manager' (should fail)
- [ ] Google Workspace sync with new org unit mappings
- [ ] Permission grant/revoke operations
- [ ] Search users by new fields
- [ ] API validation for new fields

---

## 10. Breaking Changes

### API Breaking Changes
- ❌ Role 'manager' no longer accepted (use 'admin' or 'viewer')
- ❌ Team must be one of predefined values
- ⚠️ Google groups no longer stored in users table

### Migration Required For
- Existing users with role='manager' → Update to 'viewer' + grant appropriate module permissions
- Existing users with invalid team values → Update to 'na' or appropriate team

---

## Files Modified

### Backend (admin-bff)
- `src/database/migrations.ts` - Updated schema
- `src/types/user.ts` - Updated TypeScript types
- `src/routes/users.ts` - Updated validation schemas
- `src/services/user-registry.ts` - Updated CRUD operations
- `src/services/google-workspace.ts` - Updated team/role mappings

### Documentation
- `PERMISSION_MANAGEMENT.md` - New comprehensive permission guide
- `SCHEMA_UPDATES.md` - This file

### Frontend (admincontrols)
- **To be updated**: Types and UI components

---

## Summary

✅ **Users table** now includes HR-relevant fields (address, country, date_of_joining, org_role, manager_id, phone_number)

✅ **Teams** are now constrained to 11 predefined values

✅ **Roles** simplified to admin/viewer (permissions handled separately)

✅ **Manager hierarchy** supported via manager_id foreign key

✅ **Google Workspace sync** updated with new team mappings

✅ **Permissions system** documented comprehensively

✅ **API validation** updated for all new fields

✅ **Backwards compatibility** maintained for core user operations
