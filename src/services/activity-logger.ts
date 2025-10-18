// Activity logging service for user action tracking
import geoip from 'geoip-lite';
import { db } from '../database/database';
import { logger } from '../utils/logger';
import { CreateLogDto, ActionType } from '../types/logs';
import { logQueue } from './log-queue';
import { sanitizePayload, removeCircularReferences } from '../utils/sanitizer';

export class ActivityLogger {
  /**
   * Log a critical event synchronously (blocks until written to DB)
   * Use for: authentication, permissions changes, deletions
   */
  public async logSync(logData: CreateLogDto): Promise<void> {
    try {
      // Sanitize sensitive data
      const sanitized = this.sanitizeLogData(logData);

      await db.run(
        `
        INSERT INTO admin_user_logs (
          user_id, email, action_type, action_description, module,
          http_method, endpoint_path, request_payload, response_status,
          response_time_ms, ip_address, user_agent, geo_city, geo_country,
          before_state, after_state, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        `,
        [
          sanitized.user_id,
          sanitized.email,
          sanitized.action_type,
          sanitized.action_description,
          sanitized.module || null,
          sanitized.http_method || null,
          sanitized.endpoint_path || null,
          sanitized.request_payload ? JSON.stringify(sanitized.request_payload) : null,
          sanitized.response_status || null,
          sanitized.response_time_ms || null,
          sanitized.ip_address || null,
          sanitized.user_agent || null,
          sanitized.geo_city || null,
          sanitized.geo_country || null,
          sanitized.before_state ? JSON.stringify(sanitized.before_state) : null,
          sanitized.after_state ? JSON.stringify(sanitized.after_state) : null
        ]
      );
    } catch (error) {
      // Never throw errors from logging - just log to console
      console.error('Failed to write sync log:', error);
    }
  }

  /**
   * Log a routine event asynchronously (queued for background processing)
   * Use for: read operations, exports, view actions
   */
  public logAsync(logData: CreateLogDto): void {
    try {
      // Sanitize sensitive data
      const sanitized = this.sanitizeLogData(logData);

      // Add to queue for async processing
      logQueue.enqueue(sanitized);
    } catch (error) {
      // Never throw errors from logging - just log to console
      console.error('Failed to enqueue async log:', error);
    }
  }

  /**
   * Get geolocation information from IP address
   */
  public getGeoLocation(ipAddress: string): { city: string | null; country: string | null } {
    try {
      // Handle localhost and private IPs
      if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
        return { city: null, country: null };
      }

      const geo = geoip.lookup(ipAddress);

      if (geo) {
        return {
          city: geo.city || null,
          country: geo.country || null
        };
      }

      return { city: null, country: null };
    } catch (error) {
      console.error('Failed to get geolocation:', error);
      return { city: null, country: null };
    }
  }

  /**
   * Determine module name from endpoint path
   * Examples:
   * - /api/admin/finance/* -> 'finance'
   * - /api/admin/users/* -> 'user-mgmt'
   * - /api/admin/host-management/* -> 'host-management'
   */
  public determineModule(endpointPath: string): string | undefined {
    try {
      // Extract module from path pattern: /api/admin/{module}/*
      const match = endpointPath.match(/^\/api\/admin\/([^\/]+)/);

      if (match && match[1]) {
        const pathSegment = match[1];

        // Map path segments to module names
        const moduleMap: Record<string, string> = {
          'users': 'user-mgmt',
          'finance': 'finance',
          'ai-agents': 'ai-agents',
          'tech': 'tech',
          'listings': 'listings',
          'transactions': 'transactions',
          'resolution': 'resolution',
          'claims': 'claims',
          'host-management': 'host-management',
          'logs': 'user-mgmt', // Activity logs are part of user management
          'kpis': 'kpis'
        };

        return moduleMap[pathSegment] || pathSegment;
      }

      return undefined;
    } catch (error) {
      console.error('Failed to determine module:', error);
      return undefined;
    }
  }

  /**
   * Sanitize log data to remove sensitive information and circular references
   */
  private sanitizeLogData(logData: CreateLogDto): CreateLogDto {
    try {
      // Remove circular references first
      const cleaned = removeCircularReferences(logData);

      // Sanitize sensitive fields in payloads
      const sanitized: CreateLogDto = {
        ...cleaned,
        request_payload: cleaned.request_payload ? sanitizePayload(cleaned.request_payload) : undefined,
        before_state: cleaned.before_state ? sanitizePayload(cleaned.before_state) : undefined,
        after_state: cleaned.after_state ? sanitizePayload(cleaned.after_state) : undefined
      };

      return sanitized;
    } catch (error) {
      console.error('Failed to sanitize log data:', error);
      return logData; // Return original if sanitization fails
    }
  }

  /**
   * Helper method to create a log entry from HTTP request data
   */
  public createLogFromRequest(params: {
    user: { id: number; email: string };
    actionType: ActionType | string;
    actionDescription: string;
    httpMethod?: string;
    endpointPath?: string;
    requestPayload?: any;
    responseStatus?: number;
    responseTimeMs?: number;
    ipAddress?: string;
    userAgent?: string;
    beforeState?: any;
    afterState?: any;
  }): CreateLogDto {
    const { user, ipAddress, endpointPath } = params;

    // Get geolocation if IP is provided
    const geo = ipAddress ? this.getGeoLocation(ipAddress) : { city: null, country: null };

    // Determine module from endpoint path
    const module = endpointPath ? this.determineModule(endpointPath) : undefined;

    return {
      user_id: user.id,
      email: user.email,
      action_type: params.actionType,
      action_description: params.actionDescription,
      module,
      http_method: params.httpMethod,
      endpoint_path: params.endpointPath,
      request_payload: params.requestPayload,
      response_status: params.responseStatus,
      response_time_ms: params.responseTimeMs,
      ip_address: ipAddress,
      user_agent: params.userAgent,
      geo_city: geo.city || undefined,
      geo_country: geo.country || undefined,
      before_state: params.beforeState,
      after_state: params.afterState
    };
  }

  /**
   * Determine if an action should be logged synchronously (critical) or asynchronously (routine)
   */
  public isCriticalAction(method: string, path: string): boolean {
    // Sync logging for critical operations:
    // 1. All authentication endpoints
    if (path.includes('/auth/')) {
      return true;
    }

    // 2. DELETE requests (deletions)
    if (method === 'DELETE') {
      return true;
    }

    // 3. Permission changes
    if (path.includes('/permissions')) {
      return true;
    }

    // 4. User creation/updates
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && path.includes('/users')) {
      return true;
    }

    // All other actions are routine (async logging)
    return false;
  }
}

// Export singleton instance
export const activityLogger = new ActivityLogger();
