import jwt from 'jsonwebtoken';
import { UserRegistryService } from './user-registry';
import { GoogleWorkspaceService } from './google-workspace';
import { User } from '../types/user';
import { logger } from '../utils/logger';

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  team: string;
  iat: number;
  exp: number;
}

export interface DecodedGoogleJWT {
  email: string;
  name: string;
  picture: string;
  hd?: string; // hosted domain
  aud: string;
  iss: string;
}

export class AuthService {
  private userRegistry: UserRegistryService;
  private googleWorkspace: GoogleWorkspaceService;
  private jwtSecret: string;

  constructor() {
    this.userRegistry = new UserRegistryService();
    this.googleWorkspace = new GoogleWorkspaceService();
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key';

    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set, using default value. This is insecure for production!');
    }
  }

  /**
   * Authenticate user with Google JWT token and sync with user registry
   */
  public async authenticateWithGoogle(googleJWT: string): Promise<{ user: User; token: string } | null> {
    try {
      // Decode Google JWT (in production, you'd verify this properly)
      const decoded = this.decodeGoogleJWT(googleJWT);

      if (!decoded || !this.isAllowedDomain(decoded.hd)) {
        logger.warn('Authentication failed: invalid domain', { email: decoded?.email, domain: decoded?.hd });
        return null;
      }

      logger.info('Google authentication attempt', { email: decoded.email });

      // Try to get user from registry
      let user = await this.userRegistry.getUserByEmail(decoded.email);

      if (!user) {
        // User doesn't exist, try to sync from Google Workspace
        try {
          const googleUser = await this.googleWorkspace.fetchUserByEmail(decoded.email);
          if (googleUser) {
            // Sync user from Google Workspace
            user = await this.userRegistry.syncUserFromGoogle(googleUser, 1); // System sync
            logger.info('User synced from Google Workspace', { email: decoded.email });
          } else {
            logger.error('User not found in Google Workspace', { email: decoded.email });
            return null;
          }
        } catch (error) {
          logger.error('Failed to sync user from Google Workspace', { email: decoded.email, error });
          return null;
        }
      }

      // Check if user is active
      if (user.status !== 'active') {
        logger.warn('Authentication failed: user not active', { email: decoded.email, status: user.status });
        return null;
      }

      // Update last login
      await this.userRegistry.updateLastLogin(user.id);

      // Generate JWT token
      const token = this.generateJWT(user);

      logger.info('Authentication successful', { userId: user.id, email: user.email });

      return { user, token };
    } catch (error) {
      logger.error('Authentication error', { error });
      return null;
    }
  }

  /**
   * Verify JWT token and return user
   */
  public async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JWTPayload;

      // Get fresh user data from registry
      const user = await this.userRegistry.getUserById(payload.userId);

      if (!user || user.status !== 'active') {
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Token verification failed', { error });
      return null;
    }
  }

  /**
   * Check if user has access to a specific module
   */
  public async hasModuleAccess(
    userId: number,
    module: string,
    requiredLevel: 'read' | 'write' | 'admin' = 'read'
  ): Promise<boolean> {
    try {
      return await this.userRegistry.hasModuleAccess(userId, module, requiredLevel);
    } catch (error) {
      logger.error('Error checking module access', { userId, module, requiredLevel, error });
      return false;
    }
  }

  /**
   * Get user's module access permissions
   */
  public async getUserModuleAccess(userId: number) {
    try {
      return await this.userRegistry.getUserModuleAccess(userId);
    } catch (error) {
      logger.error('Error getting user module access', { userId, error });
      return [];
    }
  }

  /**
   * Generate JWT token for user
   */
  private generateJWT(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      team: user.team
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  /**
   * Decode Google JWT (simplified - in production use proper verification)
   */
  private decodeGoogleJWT(token: string): DecodedGoogleJWT | null {
    try {
      // This is a simplified decode - in production you should verify the JWT properly
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = Buffer.from(parts[1], 'base64').toString();
      return JSON.parse(payload) as DecodedGoogleJWT;
    } catch (error) {
      logger.error('Failed to decode Google JWT', { error });
      return null;
    }
  }

  /**
   * Check if email domain is allowed
   */
  private isAllowedDomain(domain?: string): boolean {
    if (!domain) return false;

    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || ['drivelah.sg', 'drivemate.au'];
    return allowedDomains.includes(domain);
  }

  /**
   * Refresh user data and resync with Google if needed
   */
  public async refreshUser(userId: number): Promise<User | null> {
    try {
      const user = await this.userRegistry.getUserById(userId);
      if (!user) return null;

      // Check if user needs Google sync (older than 24 hours)
      const lastSync = user.last_google_sync_at ? new Date(user.last_google_sync_at) : null;
      const shouldSync = !lastSync || (Date.now() - lastSync.getTime()) > 24 * 60 * 60 * 1000;

      if (shouldSync && user.google_workspace_id) {
        try {
          const googleUser = await this.googleWorkspace.fetchUserByEmail(user.email);
          if (googleUser) {
            return await this.userRegistry.syncUserFromGoogle(googleUser, userId);
          }
        } catch (error) {
          logger.error('Failed to refresh user from Google', { userId, error });
        }
      }

      return user;
    } catch (error) {
      logger.error('Error refreshing user', { userId, error });
      return null;
    }
  }
}