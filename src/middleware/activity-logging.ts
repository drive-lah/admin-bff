// Activity logging middleware for automatic request/response tracking
import { Request, Response, NextFunction } from 'express';
import { activityLogger } from '../services/activity-logger';
import { ActionType } from '../types/logs';
import { AuthenticatedUser } from './auth';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware to automatically log all admin API requests
 * Should be registered AFTER authentication middleware but BEFORE route handlers
 */
export function activityLoggingMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip if user is not authenticated (auth middleware will handle this)
  if (!req.user) {
    return next();
  }

  // Capture request start time
  const startTime = Date.now();

  // Capture original response methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Flag to ensure we only log once
  let logged = false;

  // Wrap response methods to capture response data
  const logResponse = (statusCode: number) => {
    if (logged) return;
    logged = true;

    const responseTimeMs = Date.now() - startTime;

    // Determine action type from HTTP method
    const actionType = determineActionType(req.method, req.path);

    // Generate action description
    const actionDescription = generateActionDescription(req.method, req.path, statusCode);

    // Get IP address (handle proxy headers)
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || req.socket.remoteAddress
      || undefined;

    // Get user agent
    const userAgent = req.headers['user-agent'] || undefined;

    // Sanitize request body (don't log sensitive fields)
    const requestPayload = req.body && Object.keys(req.body).length > 0 ? req.body : undefined;

    // Create log entry
    const logData = activityLogger.createLogFromRequest({
      user: {
        id: parseInt(req.user.id),
        email: req.user.email
      },
      actionType,
      actionDescription,
      httpMethod: req.method,
      endpointPath: req.path,
      requestPayload,
      responseStatus: statusCode,
      responseTimeMs,
      ipAddress,
      userAgent
    });

    // Determine if this is a critical action (sync) or routine (async)
    const isCritical = activityLogger.isCriticalAction(req.method, req.path);

    if (isCritical) {
      // Log synchronously (blocks until written to DB)
      activityLogger.logSync(logData).catch(err => {
        console.error('Failed to log critical action:', err);
      });
    } else {
      // Log asynchronously (queued for background processing)
      activityLogger.logAsync(logData);
    }
  };

  // Override res.json
  res.json = function (data: any) {
    logResponse(res.statusCode);
    return originalJson(data);
  };

  // Override res.send
  res.send = function (data: any) {
    logResponse(res.statusCode);
    return originalSend(data);
  };

  // Handle cases where response is sent without json() or send()
  res.on('finish', () => {
    logResponse(res.statusCode);
  });

  next();
}

/**
 * Determine action type from HTTP method and path
 */
function determineActionType(method: string, path: string): ActionType | string {
  // Special cases
  if (path.includes('/login')) return ActionType.LOGIN;
  if (path.includes('/logout')) return ActionType.LOGOUT;
  if (path.includes('/export')) return ActionType.EXPORT;

  // Map HTTP methods to action types
  switch (method) {
    case 'GET':
      return ActionType.VIEW;
    case 'POST':
      return ActionType.CREATE;
    case 'PUT':
    case 'PATCH':
      return ActionType.UPDATE;
    case 'DELETE':
      return ActionType.DELETE;
    default:
      return 'unknown';
  }
}

/**
 * Generate human-readable action description
 */
function generateActionDescription(method: string, path: string, statusCode: number): string {
  const status = statusCode >= 200 && statusCode < 300 ? 'Successfully' : 'Failed to';

  // Extract resource from path
  // Example: /api/admin/users/123 -> users
  const pathParts = path.split('/').filter(p => p);
  const resource = pathParts[2] || 'resource'; // Index 2 is after 'api' and 'admin'

  // Handle specific patterns
  if (path.includes('/permissions')) {
    if (method === 'POST') return `${status} granted permission`;
    if (method === 'DELETE') return `${status} revoked permission`;
  }

  if (path.includes('/export')) {
    return `${status} exported ${resource} data`;
  }

  if (path.includes('/login')) {
    return statusCode >= 200 && statusCode < 300 ? 'Logged in successfully' : 'Login failed';
  }

  if (path.includes('/logout')) {
    return 'Logged out';
  }

  // Generic descriptions based on method
  switch (method) {
    case 'GET':
      return `${status} viewed ${resource}`;
    case 'POST':
      return `${status} created ${resource}`;
    case 'PUT':
    case 'PATCH':
      return `${status} updated ${resource}`;
    case 'DELETE':
      return `${status} deleted ${resource}`;
    default:
      return `${status} performed action on ${resource}`;
  }
}
