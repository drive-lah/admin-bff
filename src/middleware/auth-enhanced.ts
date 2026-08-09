import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { User } from '../types/user';
import { AuthenticatedUser } from './auth';
import { logger } from '../utils/logger';
import { AccessLevel } from '../constants/modules';

const authService = new AuthService();

// Helper function to convert User to AuthenticatedUser
function userToAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    picture: user.profile_photo_url || '',
    domain: user.email.split('@')[1] || '',
    permissions: {
      modules: [], // Will be populated by module access checks
      role: user.role === 'admin' ? 'admin' : 'viewer'
    }
  };
}

/**
 * Middleware to authenticate JWT token with user registry
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Access token required',
          statusCode: 401,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    const user = await authService.verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired token',
          statusCode: 401,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    req.user = userToAuthenticatedUser(user);
    next();
    return;
  } catch (error) {
    logger.error('Authentication middleware error', { error });
    return res.status(500).json({
      error: {
        message: 'Authentication service error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
};

/**
 * Middleware factory to check module access permissions
 */
export const requireModuleAccess = (
  module: string,
  requiredLevel: AccessLevel = 'read'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            message: 'User not authenticated',
            statusCode: 401,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
          },
        });
        return;
      }

      // Super admin (GOOGLE_ADMIN_EMAIL) has access to all modules
      const googleAdminEmail = process.env.GOOGLE_ADMIN_EMAIL;
      if (googleAdminEmail && req.user.email === googleAdminEmail) {
        logger.info('Super admin access granted', {
          userId: req.user.id,
          email: req.user.email,
          module,
          requiredLevel,
        });
        next();
        return;
      }

      // Admin-role users have access to all modules
      if (req.user.permissions.role === 'admin') {
        next();
        return;
      }

      const hasAccess = await authService.hasModuleAccess(parseInt(req.user.id), module, requiredLevel);

      if (!hasAccess) {
        logger.warn('Access denied', {
          userId: req.user.id,
          email: req.user.email,
          module,
          requiredLevel,
          path: req.path,
          method: req.method,
        });

        res.status(403).json({
          error: {
            message: `Insufficient permissions for ${module} module (requires ${requiredLevel} access)`,
            statusCode: 403,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check middleware error', { error });
      res.status(500).json({
        error: {
          message: 'Permission service error',
          statusCode: 500,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
      return;
    }
  };
};

/**
 * M5 — path-based finance gate. Resolves the required finance.* sub-module from
 * the request URL and the level from the HTTP method (GET/HEAD = read, else
 * write), then delegates to requireModuleAccess. Replaces the flat `finance`
 * gate so access can be granted per area (ledger vs invoices vs payroll ...).
 * A legacy `finance` grant still passes every finance.* check via the shim in
 * hasModuleAccess, so this does not lock out existing holders. An unmatched
 * finance path falls back to the legacy `finance` module (also shim-covered)
 * and logs, so a new/unmapped route can never silently open or hard-lock.
 */
const FINANCE_ROUTE_MODULES: Array<[RegExp, string]> = [
  [/\/(collections|revenue-accruals|host-expenses|cash-movements|stripe-payouts)(\/|$|\?)/, 'finance.collections'],
  [/\/accounting\/(invoices|contracts|approval-rules)(\/|$|\?)/, 'finance.invoices'],
  [/\/accounting\/reports(\/|$|\?)/, 'finance.reports'],
  [/\/accounting\/counterparties(\/|$|\?)/, 'finance.counterparties'],
  [/\/accounting(\/|$|\?)/, 'finance.ledger'],
  [/\/hr(\/|$|\?)/, 'finance.payroll'],
];

export const requireFinanceRouteAccess = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const path = (req.originalUrl || req.url || '').split('?')[0] || '';
    const level: AccessLevel =
      req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' ? 'read' : 'write';
    let mod = 'finance'; // legacy fallback (shim-covered) for any unmapped finance path
    for (const [re, m] of FINANCE_ROUTE_MODULES) {
      if (re.test(path)) { mod = m; break; }
    }
    if (mod === 'finance') {
      logger.warn('Finance route did not match a sub-module; using legacy finance gate', { path });
    }
    requireModuleAccess(mod, level)(req, res, next);
  };
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        message: 'User not authenticated',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
    return;
  }

  if (req.user.permissions.role !== 'admin') {
    logger.warn('Admin access denied', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.permissions.role,
      path: req.path,
      method: req.method,
    });

    res.status(403).json({
      error: {
        message: 'Admin privileges required',
        statusCode: 403,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user can manage other users (admin or manager role)
 */
export const requireUserManagement = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        message: 'User not authenticated',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
    return;
  }

  if (!['admin', 'manager'].includes(req.user.permissions.role)) {
    logger.warn('User management access denied', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.permissions.role,
      path: req.path,
      method: req.method,
    });

    res.status(403).json({
      error: {
        message: 'User management privileges required (admin or manager role)',
        statusCode: 403,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
    return;
  }

  next();
};

/**
 * Optional authentication - sets user if token is present and valid, but doesn't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await authService.verifyToken(token);
      if (user) {
        req.user = userToAuthenticatedUser(user);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error });
    // Don't fail the request, just continue without user
    next();
  }
};