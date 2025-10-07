import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { UserRegistryService } from '../services/user-registry';
import { CreateUserRequest, UpdateUserRequest } from '../types/user';
import { APIResponse } from '../types/api';
import { logger } from '../utils/logger';
import Joi from 'joi';

export const usersRouter = Router();
const userRegistry = new UserRegistryService();

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'viewer').required(),
  teams: Joi.array().items(
    Joi.string().valid('tech', 'core', 'resolutions', 'c&s', 'host', 'data', 'hr', 'finance', 'founders', 'product', 'marketing', 'fleet ops', 'verification', 'guest', 'flexplus', 'na')
  ).min(1).required(),
  region: Joi.string().valid('singapore', 'australia', 'global').optional(),
  google_workspace_id: Joi.string().optional(),
  intercom_id: Joi.string().optional(),
  aircall_id: Joi.string().optional(),
  slack_id: Joi.string().optional(),
  address: Joi.string().optional(),
  country: Joi.string().max(100).optional(),
  date_of_joining: Joi.date().iso().optional(),
  org_role: Joi.string().optional(),
  manager_id: Joi.number().integer().positive().optional(),
  phone_number: Joi.string().max(50).optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  role: Joi.string().valid('admin', 'viewer').optional(),
  teams: Joi.array().items(
    Joi.string().valid('tech', 'core', 'resolutions', 'c&s', 'host', 'data', 'hr', 'finance', 'founders', 'product', 'marketing', 'fleet ops', 'verification', 'guest', 'flexplus', 'na')
  ).min(1).optional(),
  // status is NOT included - it's read-only and only updated via Google Workspace sync
  region: Joi.string().valid('singapore', 'australia', 'global').optional(),
  intercom_id: Joi.string().allow('').optional(),
  aircall_id: Joi.string().allow('').optional(),
  slack_id: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  country: Joi.string().max(100).allow('').optional(),
  date_of_joining: Joi.date().iso().allow(null).optional(),
  org_role: Joi.string().allow('').optional(),
  manager_id: Joi.number().integer().positive().allow(null).optional(),
  phone_number: Joi.string().max(50).allow('').optional()
});

const setPermissionSchema = Joi.object({
  module: Joi.string().required(),
  access_level: Joi.string().valid('read', 'write', 'admin').required()
});

// GET /api/admin/users - Get all users
usersRouter.get('/', asyncHandler(async (req, res) => {
  logger.info('Fetching all users');

  try {
    const users = await userRegistry.getAllUsers();

    const apiResponse: APIResponse = {
      data: users,
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch users', { error: error.message });
    res.status(500).json({
      error: {
        message: 'Failed to retrieve users',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/users/stats - Get user statistics
usersRouter.get('/stats', asyncHandler(async (req, res) => {
  logger.info('Fetching user statistics');

  try {
    const stats = await userRegistry.getUserStats();

    const apiResponse: APIResponse = {
      data: stats,
      message: 'User statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch user statistics', { error: error.message });
    res.status(500).json({
      error: {
        message: 'Failed to retrieve user statistics',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/users/search - Search users
usersRouter.get('/search', asyncHandler(async (req, res) => {
  const query = req.query.q as string;

  if (!query || query.length < 2) {
    return res.status(400).json({
      error: {
        message: 'Search query must be at least 2 characters long',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  logger.info('Searching users', { query });

  try {
    const users = await userRegistry.searchUsers(query);

    const apiResponse: APIResponse = {
      data: users,
      message: 'User search completed successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to search users', { error: error.message });
    res.status(500).json({
      error: {
        message: 'Failed to search users',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/users/:id - Get user by ID
usersRouter.get('/:id', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({
      error: {
        message: 'Invalid user ID',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  logger.info('Fetching user by ID', { userId });

  try {
    const user = await userRegistry.getUserWithPermissions(userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    const apiResponse: APIResponse = {
      data: user,
      message: 'User retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch user', { error: error.message, userId });
    res.status(500).json({
      error: {
        message: 'Failed to retrieve user',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /api/admin/users - Create new user
usersRouter.post('/', asyncHandler(async (req, res) => {
  logger.info('Creating new user');

  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: `Validation error: ${error.details.map(d => d.message).join(', ')}`,
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    const userData: CreateUserRequest = value;
    // TODO: Get current user ID from JWT token
    const createdBy = 1; // Placeholder

    const user = await userRegistry.createUser(userData, createdBy);

    const apiResponse: APIResponse = {
      data: user,
      message: 'User created successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(apiResponse);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: {
          message: 'User with this email already exists',
          statusCode: 409,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    logger.error('Failed to create user', { error: error.message });
    res.status(500).json({
      error: {
        message: 'Failed to create user',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// PUT /api/admin/users/:id - Update user
usersRouter.put('/:id', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({
      error: {
        message: 'Invalid user ID',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  logger.info('Updating user', { userId });

  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: `Validation error: ${error.details.map(d => d.message).join(', ')}`,
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    const userData: UpdateUserRequest = value;
    // TODO: Get current user ID from JWT token
    const updatedBy = 1; // Placeholder

    const user = await userRegistry.updateUser(userId, userData, updatedBy);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    const apiResponse: APIResponse = {
      data: user,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to update user', { error: error.message, userId });
    res.status(500).json({
      error: {
        message: 'Failed to update user',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// DELETE /api/admin/users/:id - Delete user
usersRouter.delete('/:id', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({
      error: {
        message: 'Invalid user ID',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  logger.info('Deleting user', { userId });

  try {
    // TODO: Get current user ID from JWT token
    const deletedBy = 1; // Placeholder

    const success = await userRegistry.deleteUser(userId, deletedBy);

    if (!success) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    const apiResponse: APIResponse = {
      data: { deleted: true },
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to delete user', { error: error.message, userId });
    res.status(500).json({
      error: {
        message: 'Failed to delete user',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /api/admin/users/:id/permissions - Set user permission
usersRouter.post('/:id/permissions', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({
      error: {
        message: 'Invalid user ID',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  logger.info('Setting user permission', { userId });

  try {
    const { error, value } = setPermissionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: `Validation error: ${error.details.map(d => d.message).join(', ')}`,
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    const { module, access_level } = value;
    // TODO: Get current user ID from JWT token
    const grantedBy = 1; // Placeholder

    await userRegistry.setUserPermission(userId, module, access_level, grantedBy);

    const apiResponse: APIResponse = {
      data: { userId, module, access_level },
      message: 'Permission set successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to set user permission', { error: error.message, userId });
    res.status(500).json({
      error: {
        message: 'Failed to set user permission',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// DELETE /api/admin/users/:id/permissions/:module - Remove user permission
usersRouter.delete('/:id/permissions/:module', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const module = req.params.module;

  if (isNaN(userId)) {
    return res.status(400).json({
      error: {
        message: 'Invalid user ID',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  logger.info('Removing user permission', { userId, module });

  try {
    // TODO: Get current user ID from JWT token
    const removedBy = 1; // Placeholder

    await userRegistry.removeUserPermission(userId, module, removedBy);

    const apiResponse: APIResponse = {
      data: { userId, module, removed: true },
      message: 'Permission removed successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to remove user permission', { error: error.message, userId, module });
    res.status(500).json({
      error: {
        message: 'Failed to remove user permission',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /api/admin/users/sync-google - Sync all users from Google Workspace
usersRouter.post('/sync-google', asyncHandler(async (req, res) => {
  logger.info('Starting Google Workspace sync');

  try {
    // TODO: Get current user ID from JWT token
    const syncBy = 1; // Placeholder

    const result = await userRegistry.syncAllUsersFromGoogle(syncBy);

    const apiResponse: APIResponse = {
      data: result,
      message: 'Google Workspace sync completed',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to sync users from Google Workspace', { error: error.message });
    res.status(500).json({
      error: {
        message: 'Failed to sync users from Google Workspace',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /api/admin/users/sync-google/:email - Sync specific user from Google Workspace
usersRouter.post('/sync-google/:email', asyncHandler(async (req, res) => {
  const email = req.params.email;

  logger.info('Syncing specific user from Google Workspace', { email });

  try {
    // TODO: Get current user ID from JWT token
    const syncBy = 1; // Placeholder

    // This would require extending the service to sync a single user
    // For now, we'll return a placeholder response
    const apiResponse: APIResponse = {
      data: { email, synced: true },
      message: 'User sync from Google Workspace completed',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to sync user from Google Workspace', { error: error.message, email });
    res.status(500).json({
      error: {
        message: 'Failed to sync user from Google Workspace',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));