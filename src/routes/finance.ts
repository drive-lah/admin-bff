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
    // Get market parameter from query string
    const market = req.query.market || 'australia';
    logger.info(`Market selected: ${market}`);

    // Call the monitor API collections metrics endpoint
    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/metrics?market=${market}`;
    logger.info('Calling monitor API for collections metrics', { url });

    const response = await axios.get(url, {
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
        pending_by_age: monitorData.summary?.pending_by_age || {}
      },
      timeseries: monitorData.timeseries?.map((item: any) => ({
        date: item.date,
        billed_amt: item.billed_amt || 0,
        collected: item.collected_amt || 0,
        collected_amt: item.collected_amt || 0,
        pending: (item.billed_amt || 0) - (item.collected_amt || 0),
        aging_buckets: item.aging_buckets || {},
        pending_buckets: item.pending_buckets || {}
      })) || [],
      market: monitorData.market,
      currency: monitorData.currency,
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

// GET /api/admin/finance/collections/cohort-timeline - Get cohort collection timeline
financeRouter.get('/collections/cohort-timeline', asyncHandler(async (req, res) => {
  logger.info('Fetching cohort collection timeline from monitor API');

  try {
    // Get market parameter from query string
    const market = req.query.market || 'australia';
    logger.info(`Market selected for cohort timeline: ${market}`);

    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/cohort-timeline?market=${market}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Cohort collection timeline retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch cohort collection timeline from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve cohort collection timeline',
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

// GET /api/admin/finance/collections/category-breakdown - Get invoice category breakdown
financeRouter.get('/collections/category-breakdown', asyncHandler(async (req, res) => {
  logger.info('Fetching category breakdown from monitor API');

  try {
    // Get market parameter from query string (only Australia supported for now)
    const market = req.query.market || 'australia';
    logger.info(`Market selected for category breakdown: ${market}`);

    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/category-breakdown?market=${market}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Category breakdown retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch category breakdown from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve category breakdown',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/finance/collections/category-timeline - Get time series for specific category
financeRouter.get('/collections/category-timeline', asyncHandler(async (req, res) => {
  logger.info('Fetching category timeline from monitor API');

  try {
    // Get parameters from query string
    const market = req.query.market || 'australia';
    const category = req.query.category;

    if (!category) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameter: category',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    logger.info(`Market selected for category timeline: ${market}, category: ${category}`);

    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/category-timeline?market=${market}&category=${encodeURIComponent(category as string)}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Category timeline retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch category timeline from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve category timeline',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));
