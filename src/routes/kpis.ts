import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';
import axios from 'axios';
import { config } from '../config/config';

export const kpisRouter = Router();

// GET /api/admin/kpis/team/:team/measurements - Get KPI measurements for a team
kpisRouter.get('/team/:team/measurements', asyncHandler(async (req, res) => {
  const { team } = req.params;
  const { start_date, end_date } = req.query;

  logger.info(`Fetching KPI measurements for team: ${team}`, { start_date, end_date });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/measurements/team/${team}`;
    const params: string[] = [];

    if (start_date) params.push(`start_date=${start_date}`);
    if (end_date) params.push(`end_date=${end_date}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    logger.info(`Calling monitor API for team KPIs: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Team KPI measurements retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch team KPI measurements from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      team,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve team KPI measurements',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/user/:userId/measurements - Get KPI measurements for a user
kpisRouter.get('/user/:userId/measurements', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { start_date, end_date } = req.query;

  logger.info(`Fetching KPI measurements for user: ${userId}`, { start_date, end_date });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/measurements/user/${userId}`;
    const params: string[] = [];

    if (start_date) params.push(`start_date=${start_date}`);
    if (end_date) params.push(`end_date=${end_date}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    logger.info(`Calling monitor API for user KPIs: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'User KPI measurements retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch user KPI measurements from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      userId,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve user KPI measurements',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/analysis/team/:team - Generate AI analysis for team KPIs
kpisRouter.get('/analysis/team/:team', asyncHandler(async (req, res) => {
  const { team } = req.params;
  const { weeks } = req.query;

  logger.info(`Generating AI analysis for team: ${team}`, { weeks: weeks || 12 });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/analysis/team/${team}`;
    if (weeks) {
      url += `?weeks=${weeks}`;
    }

    logger.info(`Calling monitor API for KPI analysis: ${url}`);

    const response = await axios.get(url, {
      timeout: 60000, // 60 seconds for AI generation
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Team KPI analysis generated successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to generate KPI analysis from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      team,
      weeks,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.message || 'Failed to generate KPI analysis',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));
