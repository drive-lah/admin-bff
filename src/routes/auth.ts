import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth';
import { asyncHandler, createError } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';
import { activityLogger } from '../services/activity-logger';
import { ActionType } from '../types/logs';
import { config } from '../config/config';

export const authRouter = Router();

const authService = new AuthService();

// POST /api/auth/google - Verify Google JWT and issue BFF JWT
authRouter.post('/google', asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw createError('Google credential is required', 400);
  }

  // Authenticate with Google and get user from registry
  const result = await authService.authenticateWithGoogle(credential);

  if (!result) {
    throw createError('Authentication failed. Please check your credentials and domain.', 401);
  }

  const { user, token } = result;

  // Log successful login event (synchronous - critical event)
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.ip
    || req.socket.remoteAddress
    || undefined;

  const userAgent = req.headers['user-agent'] || undefined;

  const loginLog = activityLogger.createLogFromRequest({
    user: { id: user.id, email: user.email },
    actionType: ActionType.LOGIN,
    actionDescription: 'User logged in successfully',
    httpMethod: 'POST',
    endpointPath: '/api/auth/google',
    responseStatus: 200,
    ipAddress,
    userAgent
  });

  // Log synchronously (critical event)
  await activityLogger.logSync(loginLog);

  const response: APIResponse = {
    data: {
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        picture: user.profile_photo_url || '',
        role: user.role,
        teams: user.teams
      },
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    message: 'Authentication successful',
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));

// POST /api/auth/refresh - Refresh JWT token
authRouter.post('/refresh', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw createError('Refresh token is required', 400);
  }

  try {
    // Verify existing token (even if expired, we can refresh it)
    const decoded = jwt.verify(token, config.jwtSecret, { ignoreExpiration: true }) as any;

    // Support both flat and nested JWT structures
    if (!decoded.userId && !decoded.user) {
      throw createError('Invalid token structure', 400);
    }

    // Check if token is not too old (max 7 days)
    const tokenAge = Date.now() - (decoded.iat * 1000);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (tokenAge > maxAge) {
      throw createError('Token too old, please log in again', 401);
    }

    // Get user ID from token (support both structures)
    const userId = decoded.userId || decoded.user?.id;
    if (!userId) {
      throw createError('Invalid token: missing user ID', 400);
    }

    // Get fresh user data from registry
    const user = await authService.refreshUser(userId);

    if (!user) {
      throw createError('User not found or inactive', 401);
    }

    // Get user's module access
    const moduleAccess = await authService.getUserModuleAccess(user.id);
    const modules = moduleAccess.map(m => m.module_code);

    // Generate new JWT token
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        team: user.teams[0] || 'na',
        modules: modules
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    logger.info('Token refreshed successfully', {
      userId: user.id,
      email: user.email
    });

    const response: APIResponse = {
      data: {
        token: newToken,
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          picture: user.profile_photo_url || '',
          domain: user.email.split('@')[1] || '',
          permissions: {
            modules: modules,
            role: user.role
          }
        },
        expiresIn: config.jwtExpiresIn
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      throw createError('Invalid token', 400);
    }
    
    throw error;
  }
}));

// POST /api/auth/logout - Logout (client-side token invalidation)
authRouter.post('/logout', asyncHandler(async (req, res) => {
  // Note: With JWT, we can't really invalidate tokens server-side without a blacklist
  // This endpoint exists for consistency and future token blacklisting if needed

  // Log logout event if user is authenticated
  if (req.user) {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || req.socket.remoteAddress
      || undefined;

    const userAgent = req.headers['user-agent'] || undefined;

    const logoutLog = activityLogger.createLogFromRequest({
      user: { id: parseInt(req.user.id), email: req.user.email },
      actionType: ActionType.LOGOUT,
      actionDescription: 'User logged out',
      httpMethod: 'POST',
      endpointPath: '/api/auth/logout',
      responseStatus: 200,
      ipAddress,
      userAgent
    });

    // Log synchronously (critical event)
    await activityLogger.logSync(logoutLog);
  }

  logger.info('User logged out', { email: req.user?.email });

  const response: APIResponse = {
    data: { success: true },
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));