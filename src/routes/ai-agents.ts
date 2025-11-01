import { Router, Request, Response } from 'express';
import { aiAgentsClient } from '../services/ai-agents-client';
import { asyncHandler } from '../middleware/error-handler';
import { requireModule } from '../middleware/auth';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';

export const aiAgentsRouter = Router();

// Simple cache for agents list
const cache = { agents: null as any, ts: 0 };
const TTL_MS = 10_000;

// TEMPORARY: Removed module access restriction - all users can access AI agents
// aiAgentsRouter.use(requireModule('ai-agents'));

// GET /api/admin/ai-agents - Get all agents
aiAgentsRouter.get('/', asyncHandler(async (req, res) => {
  const now = Date.now();
  if (cache.agents && now - cache.ts < TTL_MS) {
    const response: APIResponse = {
      data: cache.agents,
      message: 'Agents retrieved (cached)',
      timestamp: new Date().toISOString(),
    };
    return res.json(response);
  }

  const agents = await aiAgentsClient.getAgents();
  cache.agents = agents;
  cache.ts = now;

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

// GET /api/admin/ai-agents/:id/analytics - Get agent analytics
aiAgentsRouter.get('/:id/analytics', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const analytics = await aiAgentsClient.getAgentAnalytics(id);
  
  const response: APIResponse = {
    data: analytics,
    message: 'Agent analytics retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id/actions - Get available actions
aiAgentsRouter.get('/:id/actions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const actions = await aiAgentsClient.getAgentActions(id);
  
  const response: APIResponse = {
    data: actions,
    message: 'Agent actions retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// POST /api/admin/ai-agents/:id/actions/:actionId/execute - Execute action on agent
aiAgentsRouter.post('/:id/actions/:actionId/execute', asyncHandler(async (req, res) => {
  const { id, actionId } = req.params;
  const parameters = req.body;
  
  logger.info('Executing agent action', { 
    agentId: id, 
    actionId,
    userId: req.user?.id, 
    parameters
  });
  
  const actionData = { action: actionId, parameters };
  const result = await aiAgentsClient.performAgentAction(id, actionData);
  
  const response: APIResponse = {
    data: result,
    message: `Action '${actionId}' executed successfully`,
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

// GET /api/admin/ai-agents/:id/metrics - Get agent metrics (alias for analytics)
aiAgentsRouter.get('/:id/metrics', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const metrics = await aiAgentsClient.getAgentAnalytics(id);
  
  const response: APIResponse = {
    data: metrics,
    message: 'Agent metrics retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// ========================================
// Chat Agent Evaluation Routes
// ========================================

// GET /api/admin/ai-agents/:id/evaluations/analytics - Get Chat Agent evaluation analytics
aiAgentsRouter.get('/:id/evaluations/analytics', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, market } = req.query;
  
  const queryParams = new URLSearchParams();
  if (start_date) queryParams.append('start_date', start_date as string);
  if (end_date) queryParams.append('end_date', end_date as string);
  if (market) queryParams.append('market', market as string);
  
  const analytics = await aiAgentsClient.getChatAgentEvaluationAnalytics(id, queryParams.toString());
  
  const response: APIResponse = {
    data: analytics,
    message: 'Chat Agent evaluation analytics retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id/evaluations/conversations - Get Chat Agent conversations
aiAgentsRouter.get('/:id/evaluations/conversations', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Forward all query params (limit, offset, filters, etc.)
  const queryParams = new URLSearchParams(req.query as any);
  
  const conversations = await aiAgentsClient.getChatAgentConversations(id, queryParams.toString());
  
  const response: APIResponse = {
    data: conversations,
    message: 'Chat Agent conversations retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id/evaluations/conversations/:conversationId - Get conversation detail
aiAgentsRouter.get('/:id/evaluations/conversations/:conversationId', asyncHandler(async (req, res) => {
  const { id, conversationId } = req.params;
  
  const conversation = await aiAgentsClient.getChatAgentConversationDetail(id, conversationId);
  
  const response: APIResponse = {
    data: conversation,
    message: 'Conversation details retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// POST /api/admin/ai-agents/:id/evaluations/conversations/:conversationId/rating - Submit rating
aiAgentsRouter.post('/:id/evaluations/conversations/:conversationId/rating', asyncHandler(async (req, res) => {
  const { id, conversationId } = req.params;
  const { rating, comment, reviewer_id } = req.body;
  
  logger.info('Submitting Chat Agent conversation rating', {
    agentId: id,
    conversationId,
    rating,
    userId: req.user?.id
  });
  
  const result = await aiAgentsClient.submitChatAgentRating(id, conversationId, {
    rating,
    comment,
    reviewer_id: reviewer_id || req.user?.email
  });
  
  const response: APIResponse = {
    data: result,
    message: 'Rating submitted successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id/evaluations/weekly-metrics - Get weekly metrics
aiAgentsRouter.get('/:id/evaluations/weekly-metrics', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queryParams = new URLSearchParams(req.query as any).toString();
  
  logger.info('Fetching weekly metrics', {
    agentId: id,
    queryParams,
    userId: req.user?.id
  });
  
  const data = await aiAgentsClient.getWeeklyMetrics(id, queryParams);
  
  const response: APIResponse = {
    data,
    message: 'Weekly metrics retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id/evaluations/gap-analysis - Get gap analysis
aiAgentsRouter.get('/:id/evaluations/gap-analysis', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queryParams = new URLSearchParams(req.query as any).toString();
  
  logger.info('Fetching gap analysis', {
    agentId: id,
    queryParams,
    userId: req.user?.id
  });
  
  const data = await aiAgentsClient.getGapAnalysis(id, queryParams);
  
  const response: APIResponse = {
    data,
    message: 'Gap analysis retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));

// GET /api/admin/ai-agents/:id/evaluations/sentiment-analysis - Get sentiment analysis
aiAgentsRouter.get('/:id/evaluations/sentiment-analysis', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queryParams = new URLSearchParams(req.query as any).toString();
  
  logger.info('Fetching sentiment analysis', {
    agentId: id,
    queryParams,
    userId: req.user?.id
  });
  
  const data = await aiAgentsClient.getSentimentAnalysis(id, queryParams);
  
  const response: APIResponse = {
    data,
    message: 'Sentiment analysis retrieved successfully',
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
}));