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

// GET /api/admin/kpis/listings/breakdown - Get listings breakdown (organic vs team-attributed)
kpisRouter.get('/listings/breakdown', asyncHandler(async (req, res) => {
  const { weeks } = req.query;

  logger.info(`Fetching listings breakdown`, { weeks: weeks || 26 });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/listings/breakdown`;
    if (weeks) {
      url += `?weeks=${weeks}`;
    }

    logger.info(`Calling monitor API for listings breakdown: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Listings breakdown retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch listings breakdown from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      weeks,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve listings breakdown',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/attributions/search - Search listing attributions
kpisRouter.get('/attributions/search', asyncHandler(async (req, res) => {
  const { listing_id, team_member_id, start_date, end_date, is_new_host, has_attribution, limit, offset } = req.query;

  logger.info(`Searching listing attributions`, {
    listing_id,
    team_member_id,
    start_date,
    end_date,
    is_new_host,
    has_attribution,
    limit: limit || 50,
    offset: offset || 0
  });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/attributions/search`;
    const params: string[] = [];

    if (listing_id) params.push(`listing_id=${listing_id}`);
    if (team_member_id) params.push(`team_member_id=${team_member_id}`);
    if (start_date) params.push(`start_date=${start_date}`);
    if (end_date) params.push(`end_date=${end_date}`);
    if (is_new_host) params.push(`is_new_host=${is_new_host}`);
    if (has_attribution) params.push(`has_attribution=${has_attribution}`);
    if (limit) params.push(`limit=${limit}`);
    if (offset) params.push(`offset=${offset}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    logger.info(`Calling monitor API for attribution search: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Listing attributions retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch listing attributions from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      listing_id,
      team_member_id,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve listing attributions',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/attributions/:listingId - Get attribution details for a listing
kpisRouter.get('/attributions/:listingId', asyncHandler(async (req, res) => {
  const { listingId } = req.params;

  logger.info(`Fetching attribution details for listing: ${listingId}`);

  try {
    const url = `${config.aiAgentsApiUrl}/api/monitor/kpis/attributions/${listingId}`;

    logger.info(`Calling monitor API for attribution details: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Listing attribution details retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch listing attribution details from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      listingId,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve listing attribution details',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));
