import { google } from 'googleapis';
import { GoogleWorkspaceUser } from '../types/user';
import { logger } from '../utils/logger';

export class GoogleWorkspaceService {
  private admin: any;
  private initialized: boolean = false;

  constructor() {
    this.initializeGoogleAdmin();
  }

  private async initializeGoogleAdmin(): Promise<void> {
    try {
      // Initialize Google Admin SDK
      const auth = new google.auth.GoogleAuth({
        // You'll need to set these environment variables
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: [
          'https://www.googleapis.com/auth/admin.directory.user.readonly',
          'https://www.googleapis.com/auth/admin.directory.group.readonly'
        ],
        clientOptions: {
          // Subject should be an admin email that can impersonate
          subject: process.env.GOOGLE_ADMIN_EMAIL
        }
      });

      this.admin = google.admin({ version: 'directory_v1', auth });
      this.initialized = true;
      logger.info('Google Workspace Admin SDK initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Google Workspace Admin SDK:', error);
      this.initialized = false;
    }
  }

  public async isInitialized(): Promise<boolean> {
    return this.initialized;
  }

  public async fetchAllUsers(domain: string = 'drivelah.sg'): Promise<GoogleWorkspaceUser[]> {
    if (!this.initialized) {
      throw new Error('Google Workspace service not initialized');
    }

    try {
      logger.info(`Fetching all users from Google Workspace domain: ${domain}`);
      const users: GoogleWorkspaceUser[] = [];
      let pageToken: string | undefined;

      do {
        const response = await this.admin.users.list({
          domain,
          maxResults: 100,
          orderBy: 'email',
          pageToken,
          projection: 'full',
          viewType: 'admin_view'
        });

        if (response.data.users) {
          users.push(...response.data.users.map(this.mapGoogleUser));
        }

        pageToken = response.data.nextPageToken;
      } while (pageToken);

      logger.info(`Fetched ${users.length} users from Google Workspace`);
      return users;
    } catch (error) {
      logger.error('Error fetching users from Google Workspace:', error);
      throw error;
    }
  }

  public async fetchUserByEmail(email: string): Promise<GoogleWorkspaceUser | null> {
    if (!this.initialized) {
      throw new Error('Google Workspace service not initialized');
    }

    try {
      const response = await this.admin.users.get({
        userKey: email,
        projection: 'full',
        viewType: 'admin_view'
      });

      return this.mapGoogleUser(response.data);
    } catch (error: any) {
      if (error.code === 404) {
        return null; // User not found
      }
      logger.error(`Error fetching user ${email} from Google Workspace:`, error);
      throw error;
    }
  }

  public async fetchUserGroups(email: string): Promise<string[]> {
    if (!this.initialized) {
      throw new Error('Google Workspace service not initialized');
    }

    try {
      const response = await this.admin.groups.list({
        userKey: email,
        maxResults: 100
      });

      return response.data.groups?.map((group: any) => group.email) || [];
    } catch (error) {
      logger.error(`Error fetching groups for user ${email}:`, error);
      return [];
    }
  }

  private mapGoogleUser(googleUser: any): GoogleWorkspaceUser {
    return {
      id: googleUser.id,
      primaryEmail: googleUser.primaryEmail,
      name: {
        fullName: googleUser.name?.fullName || '',
        givenName: googleUser.name?.givenName || '',
        familyName: googleUser.name?.familyName || ''
      },
      suspended: googleUser.suspended || false,
      orgUnitPath: googleUser.orgUnitPath || '/',
      thumbnailPhotoUrl: googleUser.thumbnailPhotoUrl,
      lastLoginTime: googleUser.lastLoginTime,
      creationTime: googleUser.creationTime
    };
  }

  // NOTE: These methods are kept for reference but NOT used in sync
  // Team and role assignment are done MANUALLY in the admin portal

  public mapOrgUnitToTeam(orgUnitPath: string): 'tech' | 'core' | 'resolutions' | 'c&s' | 'host' | 'data' | 'hr' | 'finance' | 'founders' | 'product' | 'na' {
    // NOT USED - Teams are assigned manually in the portal
    // This is kept for reference only
    return 'na';
  }

  public determineRoleFromGroups(groups: string[]): 'admin' | 'viewer' {
    // NOT USED - Roles are assigned manually in the portal
    // This is kept for reference only
    return 'viewer';
  }

  public getModulePermissionsFromGroups(groups: string[]): { module: string; access_level: 'read' | 'write' | 'admin' }[] {
    // NOT USED - Permissions are assigned manually in the portal
    return [];
  }
}