# Permission Management System

## Overview
The admin user management system uses a **granular, module-based permission system** that allows fine-grained access control for different parts of the admin dashboard.

---

## Architecture

### Two-Tier Permission System

#### 1. **User Role** (Basic Access Level)
- **`admin`**: Super admin with full system access
- **`viewer`**: Basic user with limited default access

Roles are assigned to users and provide a baseline access level, but the actual permissions are determined by module-specific access grants.

#### 2. **Module Permissions** (Granular Access Control)
Each user can have specific permissions for different modules, with three access levels:

- **`read`**: Can view data in the module
- **`write`**: Can view and modify data in the module
- **`admin`**: Full control over the module + can manage users within that module's context

---

## Available Modules

The system supports the following modules:

| Module | Description |
|--------|-------------|
| `users` | Admin user management and permissions |
| `finance` | Payouts, settlements, refunds, revenue management |
| `ai-agents` | AI agent configuration and monitoring |
| `tech` | Technical operations and system management |
| `listings` | Vehicle listings and availability |
| `transactions` | Payment processing and transaction history |
| `resolution` | Customer support and dispute resolution |
| `claims` | Insurance and damage claims |
| `host-management` | Host onboarding and management |

---

## Permission Assignment Strategy

### Method 1: Manual Assignment (Primary Method)
**Recommended for production use**

Permissions are explicitly granted to each user through the admin portal:

1. **Super Admin** creates/updates user permissions via:
   - Admin Dashboard → Users → Select User → Permissions Editor
   - API: `POST /api/admin/users/:id/permissions`

2. **Permission Grant Example**:
```json
{
  "module": "finance",
  "access_level": "write"
}
```

3. **Benefits**:
   - Explicit control over who has access to what
   - Easy to audit and track
   - No automatic permission escalation
   - Complies with security best practices

### Method 2: Google Groups Sync (Optional)
**Can be enabled for automation**

Google Workspace groups can be mapped to portal permissions during user sync:

```typescript
// Example mapping in google-workspace.ts
public getModulePermissionsFromGroups(groups: string[]): ModulePermission[] {
  const permissionMappings = {
    'admin-finance@drivelah.sg': { module: 'finance', access_level: 'admin' },
    'finance-team@drivelah.sg': { module: 'finance', access_level: 'write' },
    'tech-team@drivelah.sg': { module: 'tech', access_level: 'write' },
    'support-team@drivelah.sg': { module: 'resolution', access_level: 'write' },
  };

  return groups
    .filter(group => permissionMappings[group])
    .map(group => permissionMappings[group]);
}
```

**Note**: Currently disabled by default. Permissions are managed manually in the portal.

---

## Permission Enforcement

### Middleware-Based Access Control

Permissions are enforced at the API route level using middleware:

```typescript
// Example from server.ts
app.use('/api/admin/finance',
  authenticateToken,              // Verify JWT token
  requireModuleAccess('finance', 'read'),  // Check module permission
  financeRouter
);
```

### Available Middleware Functions

1. **`authenticateToken`**: Validates JWT and extracts user info
2. **`requireModuleAccess(module, level)`**: Checks if user has required module access
3. **`requireUserManagement`**: Special check for user management operations

### Permission Checking Logic

```typescript
// From user-registry.ts
public async hasModuleAccess(
  userId: number,
  module: string,
  requiredLevel: 'read' | 'write' | 'admin' = 'read'
): Promise<boolean> {
  const permission = await db.get('SELECT * FROM user_permissions WHERE user_id = $1 AND module = $2', [userId, module]);

  if (!permission) return false;

  const accessLevels = ['read', 'write', 'admin'];
  const userLevel = accessLevels.indexOf(permission.access_level);
  const requiredLevelIndex = accessLevels.indexOf(requiredLevel);

  return userLevel >= requiredLevelIndex;  // Hierarchical check
}
```

**Hierarchical Access**: `admin` > `write` > `read`
- An `admin` can do everything `write` and `read` can do
- A `write` can do everything `read` can do

---

## Managing Permissions

### Grant Permission (API)
```bash
POST /api/admin/users/:id/permissions
Authorization: Bearer <admin-token>

{
  "module": "finance",
  "access_level": "write"
}
```

### Revoke Permission (API)
```bash
DELETE /api/admin/users/:id/permissions/:module
Authorization: Bearer <admin-token>
```

### View User Permissions (API)
```bash
GET /api/admin/users/:id
Authorization: Bearer <admin-token>

Response:
{
  "data": {
    "id": 1,
    "email": "user@drivelah.sg",
    "name": "John Doe",
    "role": "viewer",
    "permissions": [
      {
        "module": "finance",
        "access_level": "write",
        "granted_by": 1,
        "granted_at": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## Permission Audit Trail

Every permission change is tracked in the `user_permissions` table:

| Field | Description |
|-------|-------------|
| `user_id` | Who receives the permission |
| `module` | Which module |
| `access_level` | What level of access |
| `granted_by` | Who granted the permission (user_id) |
| `granted_at` | When it was granted |

This provides a complete audit trail for compliance and security reviews.

---

## Best Practices

### 1. **Principle of Least Privilege**
- Grant only the minimum permissions needed
- Start with `read` access and escalate only when necessary
- Review permissions regularly

### 2. **Role Segregation**
- Use `viewer` role for most users
- Reserve `admin` role for super admins only
- Grant module-specific permissions instead of blanket admin access

### 3. **Permission Review Process**
- Quarterly review of all user permissions
- Automatic deactivation of users who haven't logged in for 90 days
- Manager approval for permission escalation

### 4. **Security Considerations**
- `users` module access should be limited to HR and super admins
- `finance` module requires additional approval
- `tech` module should only be for technical team
- Track all permission changes in application logs

---

## Frontend Integration

The admincontrols frontend provides a UI for permission management:

### Components
- **PermissionsEditor**: Visual interface for granting/revoking permissions
- **UserDetailModal**: Shows user permissions in detail
- **AdminUsersContainer**: Lists users with their roles and teams

### Example Usage
```typescript
// From useAdminUsers hook
const { setPermission, removePermission } = useAdminUsers();

// Grant permission
await setPermission(userId, {
  module: 'finance',
  access_level: 'write'
});

// Revoke permission
await removePermission(userId, 'finance');
```

---

## Migration from Old System

If migrating from an older role-based system:

1. **Map old roles to new structure**:
   - `super_admin` → role: `admin` + all module permissions at `admin` level
   - `finance_admin` → role: `viewer` + `finance` module at `admin` level
   - `support_staff` → role: `viewer` + `resolution` module at `write` level

2. **Create migration script**:
```sql
-- Example: Grant all modules to existing super admins
INSERT INTO user_permissions (user_id, module, access_level, granted_by)
SELECT id, 'finance', 'admin', 1
FROM users
WHERE role = 'admin';
```

3. **Verify permissions** post-migration with test users

---

## Summary

### Permission Assignment Flow
```
User Created → Role Assigned (admin/viewer)
      ↓
Google Sync (Optional: adds Google groups)
      ↓
Manual Permission Grants (Primary method)
      ↓
Module Access Granted (read/write/admin per module)
      ↓
Middleware Enforcement at API level
```

### Key Takeaways
- ✅ Permissions are **module-based** and **granular**
- ✅ Manual assignment is the **primary and recommended method**
- ✅ Google Groups sync is **optional** and currently **disabled by default**
- ✅ All permission changes are **tracked and auditable**
- ✅ Permissions are **hierarchical**: admin > write > read
- ✅ Use **principle of least privilege** for security
