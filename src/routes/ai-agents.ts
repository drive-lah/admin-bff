import { Router, Request, Response } from 'express';
import { aiAgentsClient } from '../services/ai-agents-client';
import { asyncHandler } from '../middleware/error-handler';
import { requireModule } from '../middleware/auth';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';

export const aiAgentsRouter = Router();

// All AI agents routes require 'ai-agents' module access
aiAgentsRouter.use(requireModule('ai-agents'));

// GET /api/admin/ai-agents - Get all agents
aiAgentsRouter.get('/', asyncHandler(async (req, res) => {
  const agents = await aiAgentsClient.getAgents();
  
  const response: APIResponse = {
    data: agents,
    message: 'Agents retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id - Get single agent
aiAgentsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agent = await aiAgentsClient.getAgent(id);
  
  const response: APIResponse = {
    data: agent,
    message: 'Agent retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// PUT /api/admin/ai-agents/:id - Update agent
aiAgentsRouter.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  logger.info('Updating agent', { 
    agentId: id, 
    userId: req.user?.id, 
    updateData 
  });
  
  const agent = await aiAgentsClient.updateAgent(id, updateData);
  
  const response: APIResponse = {
    data: agent,
    message: 'Agent updated successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// POST /api/admin/ai-agents/:id/actions - Perform action on agent
aiAgentsRouter.post('/:id/actions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const actionData = req.body;
  
  logger.info('Performing agent action', { 
    agentId: id, 
    userId: req.user?.id, 
    action: actionData.action 
  });
  
  const result = await aiAgentsClient.performAgentAction(id, actionData);
  
  const response: APIResponse = {
    data: result,
    message: `Action '${actionData.action}' performed successfully`,
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id/logs - Get agent logs
aiAgentsRouter.get('/:id/logs', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;
  
  const logs = await aiAgentsClient.getAgentLogs(id, limit);
  
  const response: APIResponse = {
    data: logs,
    message: 'Agent logs retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id/metrics - Get agent metrics
aiAgentsRouter.get('/:id/metrics', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const timeRange = req.query.timeRange as string || '24h';
  
  const metrics = await aiAgentsClient.getAgentMetrics(id, timeRange);
  
  const response: APIResponse = {
    data: metrics,
    message: 'Agent metrics retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));