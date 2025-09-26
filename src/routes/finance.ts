import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';
import axios from 'axios';
import { config } from '../config/config';

export const financeRouter = Router();

// GET /api/admin/finance/collections - Get collections metrics
financeRouter.get('/collections', asyncHandler(async (req, res) => {
  logger.info('Fetching collections metrics from monitor API');

  try {
    // Call the monitor API collections metrics endpoint
    const response = await axios.get(`${config.aiAgentsApiUrl}/api/monitor/collections/metrics`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const monitorData = response.data;

    // Transform monitor API data to match frontend expectations
    const transformedData = {
      summary: {
        total_collected: monitorData.summary?.total_collected || 0,
        pending_amount: (monitorData.summary?.total_billed || 0) - (monitorData.summary?.total_collected || 0),
        success_rate: (monitorData.summary?.overall_collection_rate || 0) * 100, // Convert to percentage
      },
      timeseries: monitorData.timeseries?.map((item: any) => ({
        date: item.date,
        collected: item.collected_amt || 0,
        pending: (item.billed_amt || 0) - (item.collected_amt || 0),
      })) || [],
      updated_at: monitorData.updated_at,
    };

    const apiResponse: APIResponse = {
      data: transformedData,
      message: 'Collections metrics retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch collections metrics from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Return error response in expected format
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve collections metrics',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/finance/collections/health - Health check for collections service
financeRouter.get('/collections/health', asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${config.aiAgentsApiUrl}/api/monitor/collections/health`, {
      timeout: 10000,
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Collections service health check successful',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Collections service health check failed', { error: error.message });

    res.status(503).json({
      error: {
        message: 'Collections service health check failed',
        statusCode: 503,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));