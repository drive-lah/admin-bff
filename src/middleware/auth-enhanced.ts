import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { User } from '../types/user';
import { logger } from '../utils/logger';

// Use the existing AuthenticatedUser interface from auth.ts
interface AuthRequest extends Request {
  user?: User;
}

const authService = new AuthService();

/**
 * Middleware to authenticate JWT token with user registry
 */
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    req.user = user;
    next();
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
  requiredLevel: 'read' | 'write' | 'admin' = 'read'
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            message: 'User not authenticated',
            statusCode: 401,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
          },
        });
      }

      const hasAccess = await authService.hasModuleAccess(req.user.id, module, requiredLevel);

      if (!hasAccess) {
        logger.warn('Access denied', {
          userId: req.user.id,
          email: req.user.email,
          module,
          requiredLevel,
          path: req.path,
          method: req.method,
        });

        return res.status(403).json({
          error: {
            message: `Insufficient permissions for ${module} module (requires ${requiredLevel} access)`,
            statusCode: 403,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
          },
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check middleware error', { error });
      return res.status(500).json({
        error: {
          message: 'Permission service error',
          statusCode: 500,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }
  };
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        message: 'User not authenticated',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  if (req.user.role !== 'admin') {
    logger.warn('Admin access denied', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      path: req.path,
      method: req.method,
    });

    return res.status(403).json({
      error: {
        message: 'Admin privileges required',
        statusCode: 403,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  next();
};

/**
 * Middleware to check if user can manage other users (admin or manager role)
 */
export const requireUserManagement = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        message: 'User not authenticated',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    logger.warn('User management access denied', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      path: req.path,
      method: req.method,
    });

    return res.status(403).json({
      error: {
        message: 'User management privileges required (admin or manager role)',
        statusCode: 403,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  next();
};

/**
 * Optional authentication - sets user if token is present and valid, but doesn't require it
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await authService.verifyToken(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error });
    // Don't fail the request, just continue without user
    next();
  }
};