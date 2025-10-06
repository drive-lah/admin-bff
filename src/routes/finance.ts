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

// GET /api/admin/finance/revenue-accruals/summary - Get revenue accruals summary metrics
financeRouter.get('/revenue-accruals/summary', asyncHandler(async (req, res) => {
  logger.info('Fetching revenue accruals summary from monitor API');

  try {
    // Get market parameter from query string
    const market = req.query.market || 'australia';
    logger.info(`Market selected for revenue accruals summary: ${market}`);

    const url = `${config.aiAgentsApiUrl}/api/monitor/revenue-accruals/summary?market=${market}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Revenue accruals summary retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch revenue accruals summary from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve revenue accruals summary',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/finance/revenue-accruals/timeline - Get revenue accruals timeline
financeRouter.get('/revenue-accruals/timeline', asyncHandler(async (req, res) => {
  logger.info('Fetching revenue accruals timeline from monitor API');

  try {
    // Get parameters from query string
    const market = req.query.market || 'australia';
    const months = req.query.months || '12';
    logger.info(`Market selected for revenue accruals timeline: ${market}, months: ${months}`);

    const url = `${config.aiAgentsApiUrl}/api/monitor/revenue-accruals/timeline?market=${market}&months=${months}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Revenue accruals timeline retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch revenue accruals timeline from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve revenue accruals timeline',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/finance/revenue-accruals/view-definitions - Get view definitions for accrual metrics
financeRouter.get('/revenue-accruals/view-definitions', asyncHandler(async (req, res) => {
  logger.info('Fetching accrual view definitions from monitor API');

  try {
    // Get market parameter from query string
    const market = req.query.market || 'australia';
    logger.info(`Market selected for view definitions: ${market}`);

    const url = `${config.aiAgentsApiUrl}/api/monitor/revenue-accruals/view-definitions?market=${market}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Accrual view definitions retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch accrual view definitions from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve accrual view definitions',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/finance/host-expenses/timeline - Get host expenses timeline
financeRouter.get('/host-expenses/timeline', asyncHandler(async (req, res) => {
  logger.info('Fetching host expenses timeline from monitor API');

  try {
    // Get parameters from query string
    const market = req.query.market || 'singapore';
    const months = req.query.months || '12';
    logger.info(`Market selected for host expenses timeline: ${market}, months: ${months}`);

    const url = `${config.aiAgentsApiUrl}/api/monitor/host-expenses/timeline?market=${market}&months=${months}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Host expenses timeline retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch host expenses timeline from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve host expenses timeline',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/finance/host-expenses/view-definitions - Get expense view definitions
financeRouter.get('/host-expenses/view-definitions', asyncHandler(async (req, res) => {
  logger.info('Fetching expense view definitions from monitor API');

  try {
    // Get market parameter from query string
    const market = req.query.market || 'singapore';
    logger.info(`Market selected for expense view definitions: ${market}`);

    const url = `${config.aiAgentsApiUrl}/api/monitor/host-expenses/view-definitions?market=${market}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Expense view definitions retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch expense view definitions from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve expense view definitions',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// Cash Movements Timeline - Get monthly timeline of actual cash in/out from Stripe
financeRouter.get('/cash-movements/timeline', asyncHandler(async (req, res) => {
  try {
    const market = (req.query.market as string) || 'singapore';
    const months = (req.query.months as string) || '12';

    const url = `${config.aiAgentsApiUrl}/api/monitor/finance/cash-movements/timeline?market=${market}&months=${months}`;
    logger.info(`Fetching cash movements timeline from: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
    });

    res.json({
      data: response.data,
      message: 'Cash movements timeline retrieved successfully',
    });
  } catch (error: any) {
    logger.error('Cash movements timeline API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve cash movements timeline',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// Stripe Payouts Details - Get individual payout transactions for QuickBooks matching
financeRouter.get('/stripe-payouts/details', asyncHandler(async (req, res) => {
  try {
    const market = (req.query.market as string) || 'singapore';
    const months = (req.query.months as string) || '12';

    const url = `${config.aiAgentsApiUrl}/api/monitor/finance/stripe-payouts/details?market=${market}&months=${months}`;
    logger.info(`Fetching Stripe payouts details from: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
    });

    res.json({
      data: response.data,
      message: 'Stripe payouts details retrieved successfully',
    });
  } catch (error: any) {
    logger.error('Stripe payouts details API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve Stripe payouts details',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));
