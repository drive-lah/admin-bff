import { Router, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/config';
import { asyncHandler, createError } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';

export const authRouter = Router();

// Define allowed domains for admin access
const ALLOWED_DOMAINS = ['drivelah.sg', 'drivemate.au'];

// Define user permissions based on email
// TEMPORARY: All users get full admin access (remove restrictions for now)
const getUserPermissions = (email: string) => {
  // Give everyone full admin access for now - we'll implement proper permissions later
  return {
    modules: ['users', 'listings', 'transactions', 'resolution', 'claims', 'host-management', 'ai-agents', 'tech'],
    role: 'admin' as const
  };
};

// POST /api/auth/google - Verify Google JWT and issue BFF JWT
authRouter.post('/google', asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw createError('Google credential is required', 400);
  }

  try {
    // Decode Google JWT (Note: In production, verify the signature with Google's public keys)
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
    
    // Validate required fields
    if (!payload.email || !payload.name || !payload.email_verified) {
      throw createError('Invalid Google token payload', 400);
    }

    // Check if email is verified
    if (!payload.email_verified) {
      throw createError('Email not verified with Google', 400);
    }

    // Check domain restrictions
    const domain = payload.hd || payload.email.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      throw createError(`Access denied. Only ${ALLOWED_DOMAINS.join(', ')} domains are allowed.`, 403);
    }

    // Create user object
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      domain,
      permissions: getUserPermissions(payload.email)
    };

    // Create BFF JWT token
    const token = jwt.sign(
      { user },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    logger.info('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      domain,
      role: user.permissions.role,
      modules: user.permissions.modules.length
    });

    const response: APIResponse = {
      data: {
        token,
        user,
        expiresIn: config.jwtExpiresIn
      },
      message: 'Authentication successful',
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Google authentication failed', { 
      error: error.message,
      credential: credential?.substring(0, 50) + '...' // Log only first part for debugging
    });
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError('Invalid Google token', 400);
  }
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

    if (!decoded.user) {
      throw createError('Invalid token structure', 400);
    }

    // Check if token is not too old (max 7 days)
    const tokenAge = Date.now() - (decoded.iat * 1000);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (tokenAge > maxAge) {
      throw createError('Token too old, please log in again', 401);
    }

    // Create new token with same user data
    const newToken = jwt.sign(
      { user: decoded.user },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    logger.info('Token refreshed successfully', {
      userId: decoded.user.id,
      email: decoded.user.email
    });

    const response: APIResponse = {
      data: {
        token: newToken,
        user: decoded.user,
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
  
  logger.info('User logged out');

  const response: APIResponse = {
    data: { success: true },
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}));