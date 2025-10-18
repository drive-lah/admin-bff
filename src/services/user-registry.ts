import { db } from '../database/database';
import { GoogleWorkspaceService } from './google-workspace';
import {
  User,
  UserPermission,
  CreateUserRequest,
  UpdateUserRequest,
  UserWithPermissions,
  GoogleWorkspaceUser,
  ModuleAccess
} from '../types/user';
import { logger } from '../utils/logger';
import { activityLogger } from './activity-logger';
import { ActionType } from '../types/logs';

export class UserRegistryService {
  private googleWorkspace: GoogleWorkspaceService;

  constructor() {
    this.googleWorkspace = new GoogleWorkspaceService();
  }

  // Basic CRUD operations

  public async getAllUsers(): Promise<User[]> {
    try {
      return await db.all<User>(`
        SELECT * FROM users
        ORDER BY created_at DESC
      `);
    } catch (error) {
      logger.error('Error fetching all users:', error);
      throw error;
    }
  }

  public async getUserById(id: number): Promise<User | undefined> {
    try {
      return await db.get<User>('SELECT * FROM users WHERE id = $1', [id]);
    } catch (error) {
      logger.error(`Error fetching user with id ${id}:`, error);
      throw error;
    }
  }

  public async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      return await db.get<User>('SELECT * FROM users WHERE email = $1', [email]);
    } catch (error) {
      logger.error(`Error fetching user with email ${email}:`, error);
      throw error;
    }
  }

  public async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      return await db.get<User>('SELECT * FROM users WHERE google_workspace_id = $1', [googleId]);
    } catch (error) {
      logger.error(`Error fetching user with Google ID ${googleId}:`, error);
      throw error;
    }
  }

  public async createUser(userData: CreateUserRequest, createdBy: number): Promise<User> {
    try {
      // Get the user performing the action
      const actor = await this.getUserById(createdBy);
      if (!actor) {
        throw new Error('Actor user not found');
      }

      await db.run(`
        INSERT INTO users (
          email, name, role, teams, region, google_workspace_id, intercom_id, aircall_id, slack_id,
          address, country, date_of_joining, org_role, manager_id, phone_number,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        userData.email,
        userData.name,
        userData.role,
        userData.teams, // PostgreSQL array
        userData.region || 'global',
        userData.google_workspace_id,
        userData.intercom_id,
        userData.aircall_id,
        userData.slack_id,
        userData.address,
        userData.country,
        userData.date_of_joining,
        userData.org_role,
        userData.manager_id,
        userData.phone_number
      ]);

      const user = await this.getUserByEmail(userData.email);
      if (!user) {
        throw new Error('Failed to create user');
      }

      // Log user creation activity (synchronous - critical event)
      const logData = activityLogger.createLogFromRequest({
        user: { id: actor.id, email: actor.email },
        actionType: ActionType.CREATE,
        actionDescription: `Created user: ${user.email}`,
        module: 'user-mgmt',
        afterState: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          teams: user.teams
        }
      });
      await activityLogger.logSync(logData);

      logger.info(`User created: ${userData.email} by user ${createdBy}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  public async updateUser(id: number, userData: UpdateUserRequest, updatedBy: number): Promise<User | undefined> {
    try {
      // Get the user performing the action
      const actor = await this.getUserById(updatedBy);
      if (!actor) {
        throw new Error('Actor user not found');
      }

      // Capture before state
      const beforeUser = await this.getUserById(id);
      if (!beforeUser) {
        throw new Error('User to update not found');
      }

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (userData.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        params.push(userData.name);
      }
      if (userData.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        params.push(userData.role);
      }
      if (userData.teams !== undefined) {
        updates.push(`teams = $${paramIndex++}`);
        params.push(userData.teams); // PostgreSQL array
      }
      // status is NOT editable via update - only synced from Google Workspace
      if (userData.intercom_id !== undefined) {
        updates.push(`intercom_id = $${paramIndex++}`);
        params.push(userData.intercom_id);
      }
      if (userData.aircall_id !== undefined) {
        updates.push(`aircall_id = $${paramIndex++}`);
        params.push(userData.aircall_id);
      }
      if (userData.slack_id !== undefined) {
        updates.push(`slack_id = $${paramIndex++}`);
        params.push(userData.slack_id);
      }
      if (userData.address !== undefined) {
        updates.push(`address = $${paramIndex++}`);
        params.push(userData.address);
      }
      if (userData.country !== undefined) {
        updates.push(`country = $${paramIndex++}`);
        params.push(userData.country);
      }
      if (userData.date_of_joining !== undefined) {
        updates.push(`date_of_joining = $${paramIndex++}`);
        params.push(userData.date_of_joining);
      }
      if (userData.org_role !== undefined) {
        updates.push(`org_role = $${paramIndex++}`);
        params.push(userData.org_role);
      }
      if (userData.manager_id !== undefined) {
        updates.push(`manager_id = $${paramIndex++}`);
        params.push(userData.manager_id);
      }
      if (userData.phone_number !== undefined) {
        updates.push(`phone_number = $${paramIndex++}`);
        params.push(userData.phone_number);
      }
      if (userData.region !== undefined) {
        updates.push(`region = $${paramIndex++}`);
        params.push(userData.region);
      }

      if (updates.length === 0) {
        return await this.getUserById(id);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await db.run(`
        UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
      `, params);

      // Capture after state
      const afterUser = await this.getUserById(id);

      // Log user update activity (synchronous - critical event)
      const logData = activityLogger.createLogFromRequest({
        user: { id: actor.id, email: actor.email },
        actionType: ActionType.UPDATE,
        actionDescription: `Updated user: ${beforeUser.email}`,
        module: 'user-mgmt',
        beforeState: {
          userId: beforeUser.id,
          email: beforeUser.email,
          name: beforeUser.name,
          role: beforeUser.role,
          teams: beforeUser.teams
        },
        afterState: afterUser ? {
          userId: afterUser.id,
          email: afterUser.email,
          name: afterUser.name,
          role: afterUser.role,
          teams: afterUser.teams
        } : undefined
      });
      await activityLogger.logSync(logData);

      logger.info(`User updated: ID ${id} by user ${updatedBy}`);
      return afterUser;
    } catch (error) {
      logger.error(`Error updating user with id ${id}:`, error);
      throw error;
    }
  }

  public async deleteUser(id: number, deletedBy: number): Promise<boolean> {
    try {
      // Get the user performing the action
      const actor = await this.getUserById(deletedBy);
      if (!actor) {
        throw new Error('Actor user not found');
      }

      // Capture before state
      const beforeUser = await this.getUserById(id);
      if (!beforeUser) {
        throw new Error('User to delete not found');
      }

      await db.run('DELETE FROM users WHERE id = $1', [id]);

      // Log user deletion activity (synchronous - critical event)
      const logData = activityLogger.createLogFromRequest({
        user: { id: actor.id, email: actor.email },
        actionType: ActionType.DELETE,
        actionDescription: `Deleted user: ${beforeUser.email}`,
        module: 'user-mgmt',
        beforeState: {
          userId: beforeUser.id,
          email: beforeUser.email,
          name: beforeUser.name,
          role: beforeUser.role,
          teams: beforeUser.teams
        }
      });
      await activityLogger.logSync(logData);

      logger.info(`User deleted: ID ${id} by user ${deletedBy}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  }

  public async updateLastLogin(userId: number): Promise<void> {
    try {
      await db.run(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } catch (error) {
      logger.error(`Error updating last login for user ${userId}:`, error);
      throw error;
    }
  }

  // Permission management

  public async getUserPermissions(userId: number): Promise<UserPermission[]> {
    try {
      return await db.all<UserPermission>(`
        SELECT * FROM user_permissions WHERE user_id = $1
        ORDER BY module
      `, [userId]);
    } catch (error) {
      logger.error(`Error fetching permissions for user ${userId}:`, error);
      throw error;
    }
  }

  public async getUserWithPermissions(userId: number): Promise<UserWithPermissions | undefined> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return undefined;

      const permissions = await this.getUserPermissions(userId);

      return {
        ...user,
        permissions
      };
    } catch (error) {
      logger.error(`Error fetching user with permissions for user ${userId}:`, error);
      throw error;
    }
  }

  public async setUserPermission(
    userId: number,
    module: string,
    accessLevel: 'read' | 'write' | 'admin',
    grantedBy: number
  ): Promise<void> {
    try {
      // Get the user performing the action
      const actor = await this.getUserById(grantedBy);
      if (!actor) {
        throw new Error('Actor user not found');
      }

      // Get the target user
      const targetUser = await this.getUserById(userId);
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Capture before state (existing permission if any)
      const beforePermission = await db.get<UserPermission>(`
        SELECT * FROM user_permissions WHERE user_id = $1 AND module = $2
      `, [userId, module]);

      await db.run(`
        INSERT INTO user_permissions (user_id, module, access_level, granted_by, granted_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, module) DO UPDATE SET
          access_level = excluded.access_level,
          granted_by = excluded.granted_by,
          granted_at = CURRENT_TIMESTAMP
      `, [userId, module, accessLevel, grantedBy]);

      // Capture after state
      const afterPermission = await db.get<UserPermission>(`
        SELECT * FROM user_permissions WHERE user_id = $1 AND module = $2
      `, [userId, module]);

      // Log permission change activity (synchronous - critical event)
      const actionDescription = beforePermission
        ? `Updated permission for ${targetUser.email}: ${module} (${beforePermission.access_level} → ${accessLevel})`
        : `Granted permission to ${targetUser.email}: ${module} (${accessLevel})`;

      const logData = activityLogger.createLogFromRequest({
        user: { id: actor.id, email: actor.email },
        actionType: ActionType.UPDATE,
        actionDescription,
        module: 'user-mgmt',
        beforeState: beforePermission ? {
          userId,
          targetEmail: targetUser.email,
          module,
          accessLevel: beforePermission.access_level
        } : undefined,
        afterState: afterPermission ? {
          userId,
          targetEmail: targetUser.email,
          module,
          accessLevel: afterPermission.access_level
        } : undefined
      });
      await activityLogger.logSync(logData);

      logger.info(`Permission granted: User ${userId} - ${module}:${accessLevel} by user ${grantedBy}`);
    } catch (error) {
      logger.error(`Error setting permission for user ${userId}:`, error);
      throw error;
    }
  }

  public async removeUserPermission(userId: number, module: string, removedBy: number): Promise<void> {
    try {
      // Get the user performing the action
      const actor = await this.getUserById(removedBy);
      if (!actor) {
        throw new Error('Actor user not found');
      }

      // Get the target user
      const targetUser = await this.getUserById(userId);
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Capture before state
      const beforePermission = await db.get<UserPermission>(`
        SELECT * FROM user_permissions WHERE user_id = $1 AND module = $2
      `, [userId, module]);

      await db.run('DELETE FROM user_permissions WHERE user_id = $1 AND module = $2', [userId, module]);

      // Log permission removal activity (synchronous - critical event)
      const logData = activityLogger.createLogFromRequest({
        user: { id: actor.id, email: actor.email },
        actionType: ActionType.DELETE,
        actionDescription: `Revoked permission from ${targetUser.email}: ${module}`,
        module: 'user-mgmt',
        beforeState: beforePermission ? {
          userId,
          targetEmail: targetUser.email,
          module,
          accessLevel: beforePermission.access_level
        } : undefined
      });
      await activityLogger.logSync(logData);

      logger.info(`Permission removed: User ${userId} - ${module} by user ${removedBy}`);
    } catch (error) {
      logger.error(`Error removing permission for user ${userId}:`, error);
      throw error;
    }
  }

  public async hasModuleAccess(userId: number, module: string, requiredLevel: 'read' | 'write' | 'admin' = 'read'): Promise<boolean> {
    try {
      const permission = await db.get<UserPermission>(`
        SELECT * FROM user_permissions
        WHERE user_id = $1 AND module = $2
      `, [userId, module]);

      if (!permission) return false;

      const accessLevels = ['read', 'write', 'admin'];
      const userLevel = accessLevels.indexOf(permission.access_level);
      const requiredLevelIndex = accessLevels.indexOf(requiredLevel);

      return userLevel >= requiredLevelIndex;
    } catch (error) {
      logger.error(`Error checking module access for user ${userId}:`, error);
      return false;
    }
  }

  public async getUserModuleAccess(userId: number): Promise<ModuleAccess[]> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.map(p => ({
        module: p.module,
        access_level: p.access_level
      }));
    } catch (error) {
      logger.error(`Error fetching module access for user ${userId}:`, error);
      return [];
    }
  }

  // Google Workspace sync

  public async syncUserFromGoogle(googleUser: GoogleWorkspaceUser, syncBy: number): Promise<User> {
    try {
      const existingUser = await this.getUserByGoogleId(googleUser.id);
      const groups = await this.googleWorkspace.fetchUserGroups(googleUser.primaryEmail);

      let user: User;

      if (existingUser) {
        // Update existing user - ONLY sync name, status, photo, and Google metadata
        // DO NOT override role or team - those are managed manually in the portal
        await db.run(`
          UPDATE users SET
            name = $1,
            status = $2,
            google_org_unit = $3,
            profile_photo_url = $4,
            last_google_sync_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE google_workspace_id = $5
        `, [
          googleUser.name.fullName,
          googleUser.suspended ? 'suspended' : 'active',
          googleUser.orgUnitPath,
          googleUser.thumbnailPhotoUrl,
          googleUser.id
        ]);

        user = (await this.getUserByGoogleId(googleUser.id))!;
        logger.info(`User synced from Google Workspace (updated): ${googleUser.primaryEmail}`);
      } else {
        // Create new user - assign default role and team
        // Admin must manually update role/team and grant permissions after sync
        await db.run(`
          INSERT INTO users (
            email, name, role, teams, status, google_workspace_id, google_org_unit,
            profile_photo_url, last_google_sync_at,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          googleUser.primaryEmail,
          googleUser.name.fullName,
          'viewer',  // Default role - admin must manually update
          ['na'],    // Default teams array - admin must manually assign
          googleUser.suspended ? 'suspended' : 'active',
          googleUser.id,
          googleUser.orgUnitPath,
          googleUser.thumbnailPhotoUrl
        ]);

        user = (await this.getUserByEmail(googleUser.primaryEmail))!;
        logger.info(`New user created from Google Workspace sync (requires manual role/team assignment): ${googleUser.primaryEmail}`);
      }

      return user;
    } catch (error) {
      logger.error(`Error syncing user from Google Workspace: ${googleUser.primaryEmail}`, error);
      throw error;
    }
  }

  public async syncAllUsersFromGoogle(syncBy: number): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const domains = ['drivelah.sg', 'drivemate.au'];

      for (const domain of domains) {
        try {
          const googleUsers = await this.googleWorkspace.fetchAllUsers(domain);

          for (const googleUser of googleUsers) {
            try {
              await this.syncUserFromGoogle(googleUser, syncBy);
              synced++;
            } catch (error) {
              logger.error(`Error syncing user ${googleUser.primaryEmail}:`, error);
              errors++;
            }
          }
        } catch (error) {
          logger.error(`Error fetching users from domain ${domain}:`, error);
        }
      }

      logger.info(`Google Workspace sync completed: ${synced} synced, ${errors} errors`);
    } catch (error) {
      logger.error('Error during Google Workspace sync:', error);
      throw error;
    }

    return { synced, errors };
  }

  // Analytics and search

  public async searchUsers(query: string): Promise<User[]> {
    try {
      return await db.all<User>(`
        SELECT * FROM users
        WHERE email LIKE $1 OR name LIKE $2 OR $3 = ANY(teams)
        ORDER BY name
        LIMIT 50
      `, [`%${query}%`, `%${query}%`, query]);
    } catch (error) {
      logger.error(`Error searching users with query ${query}:`, error);
      throw error;
    }
  }

  public async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byRole: { role: string; count: number }[];
    byTeam: { team: string; count: number }[];
  }> {
    try {
      const total = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
      const active = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE status = \'active\'');
      const inactive = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE status = \'inactive\'');
      const suspended = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE status = \'suspended\'');

      const byRole = await db.all<{ role: string; count: number }>(`
        SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC
      `);

      const byTeam = await db.all<{ team: string; count: number }>(`
        SELECT UNNEST(teams) as team, COUNT(*) as count
        FROM users
        GROUP BY team
        ORDER BY count DESC
      `);

      return {
        total: total?.count || 0,
        active: active?.count || 0,
        inactive: inactive?.count || 0,
        suspended: suspended?.count || 0,
        byRole,
        byTeam
      };
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      throw error;
    }
  }
}