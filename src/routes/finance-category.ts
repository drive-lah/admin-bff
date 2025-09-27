import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';
import axios from 'axios';
import { config } from '../config/config';

export const financeCategoryRouter = Router();

// GET /api/admin/finance/collections/category-breakdown - Get invoice category breakdown
financeCategoryRouter.get('/collections/category-breakdown', asyncHandler(async (req, res) => {
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