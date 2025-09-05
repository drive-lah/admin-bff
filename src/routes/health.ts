import { Router, Request, Response } from 'express';
import { aiAgentsClient } from '../services/ai-agents-client';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { HealthStatus } from '../types/api';
import packageJson from '../../package.json';

export const healthRouter = Router();

// GET /api/health - Basic health check
healthRouter.get('/', asyncHandler(async (req, res) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    services: {},
  };

  // Check AI Agents API
  try {
    const start = Date.now();
    await aiAgentsClient.checkHealth();
    health.services['ai-agents-api'] = {
      status: 'up',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error: any) {
    health.services['ai-agents-api'] = {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error.message,
    };
    health.status = 'unhealthy';
  }

  // Add more service checks here as needed
  // Example:
  // health.services['users-api'] = await checkUsersAPI();
  // health.services['database'] = await checkDatabase();

  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  if (health.status === 'unhealthy') {
    logger.warn('Health check failed', { health });
  }

  res.status(statusCode).json(health);
}));

// GET /api/health/ready - Readiness probe (for Kubernetes/Docker)
healthRouter.get('/ready', asyncHandler(async (req, res) => {
  // Check if all critical services are available
  const checks = [];

  // Check AI Agents API
  try {
    await aiAgentsClient.checkHealth();
    checks.push({ service: 'ai-agents-api', status: 'ready' });
  } catch (error: any) {
    checks.push({ service: 'ai-agents-api', status: 'not-ready', error: error.message });
  }

  const allReady = checks.every(check => check.status === 'ready');
  const statusCode = allReady ? 200 : 503;

  res.status(statusCode).json({
    status: allReady ? 'ready' : 'not-ready',
    checks,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/health/live - Liveness probe (for Kubernetes/Docker)
healthRouter.get('/live', asyncHandler(async (req, res) => {
  // Basic liveness check - if this endpoint responds, the service is alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: packageJson.version,
  });
}));