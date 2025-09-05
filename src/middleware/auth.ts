import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { createError } from './error-handler';
import { logger } from '../utils/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  domain: string;
  permissions: {
    modules: string[];
    role: 'admin' | 'manager' | 'viewer';
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createError('Authorization header is required', 401);
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      throw createError('Token is required', 401);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    // Validate token structure
    if (!decoded.user) {
      throw createError('Invalid token structure', 401);
    }

    // Attach user to request
    req.user = decoded.user;

    logger.info('User authenticated', {
      userId: req.user?.id,
      email: req.user?.email,
      role: req.user?.permissions.role,
    });

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError('Invalid token', 401));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(createError('Token expired', 401));
    }

    next(error);
  }
};

export const requireRole = (...roles: ('admin' | 'manager' | 'viewer')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!roles.includes(req.user.permissions.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requireModule = (...modules: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const hasAccess = modules.some(module => 
      req.user?.permissions.modules.includes(module)
    );

    if (!hasAccess) {
      return next(createError('Module access denied', 403));
    }

    next();
  };
};