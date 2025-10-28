import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';
import axios from 'axios';
import { config } from '../config/config';
import multer from 'multer';
import FormData from 'form-data';

export const collectionsRouter = Router();

// Configure multer for file uploads (memory storage for proxy)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// GET /api/admin/collections/default-candidates - Get default filing candidates
collectionsRouter.get('/default-candidates', asyncHandler(async (req, res) => {
  logger.info('Fetching default filing candidates', { query: req.query });

  try {
    // Build URL with query parameters
    const queryParams = new URLSearchParams();
    
    if (req.query.candidate_status) queryParams.append('candidate_status', req.query.candidate_status as string);
    if (req.query.bureau_status) queryParams.append('bureau_status', req.query.bureau_status as string);
    if (req.query.batch_id) queryParams.append('batch_id', req.query.batch_id as string);
    if (req.query.date_from) queryParams.append('date_from', req.query.date_from as string);
    if (req.query.date_to) queryParams.append('date_to', req.query.date_to as string);
    if (req.query.amount_min) queryParams.append('amount_min', req.query.amount_min as string);
    if (req.query.amount_max) queryParams.append('amount_max', req.query.amount_max as string);
    if (req.query.search) queryParams.append('search', req.query.search as string);
    if (req.query.limit) queryParams.append('limit', req.query.limit as string);
    if (req.query.offset) queryParams.append('offset', req.query.offset as string);

    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/default-candidates?${queryParams.toString()}`;
    logger.info(`Calling monitor API: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Default filing candidates retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch default filing candidates', {
      error: error.message,
      stack: error.stack,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || error.message || 'Failed to fetch candidates',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
}));

// POST /api/admin/collections/preview-bbc6 - Preview BBC6 file
collectionsRouter.post('/preview-bbc6', asyncHandler(async (req, res) => {
  logger.info('Generating BBC6 preview', { body: req.body });

  try {
    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/preview-bbc6`;

    const response = await axios.post(url, req.body, {
      timeout: 60000, // Longer timeout for file generation
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'BBC6 preview generated successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to generate BBC6 preview', {
      error: error.message,
      stack: error.stack,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || error.message || 'Failed to generate preview',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
}));

// POST /api/admin/collections/file-defaults - File defaults to illion
collectionsRouter.post('/file-defaults', asyncHandler(async (req, res) => {
  logger.info('Filing defaults to illion', { body: req.body });

  try {
    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/file-defaults`;

    const response = await axios.post(url, req.body, {
      timeout: 120000, // 2 minutes timeout for SFTP upload
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Defaults filed successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to file defaults', {
      error: error.message,
      stack: error.stack,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || error.message || 'Failed to file defaults',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
}));

// POST /api/admin/collections/upload-response - Upload illion response file
collectionsRouter.post('/upload-response', upload.single('file'), asyncHandler(async (req, res) => {
  logger.info('Uploading illion response file', { 
    filename: req.file?.originalname,
    size: req.file?.size 
  });

  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'No file provided',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Create FormData to forward the file to backend
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/upload-response`;

    const response = await axios.post(url, formData, {
      timeout: 60000,
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Response file processed successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to process response file', {
      error: error.message,
      stack: error.stack,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || error.message || 'Failed to process response file',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
}));

// GET /api/admin/collections/filing-history - Get filing history
collectionsRouter.get('/filing-history', asyncHandler(async (req, res) => {
  logger.info('Fetching filing history', { query: req.query });

  try {
    const queryParams = new URLSearchParams();
    
    if (req.query.date_from) queryParams.append('date_from', req.query.date_from as string);
    if (req.query.date_to) queryParams.append('date_to', req.query.date_to as string);
    if (req.query.environment) queryParams.append('environment', req.query.environment as string);
    if (req.query.limit) queryParams.append('limit', req.query.limit as string);
    if (req.query.offset) queryParams.append('offset', req.query.offset as string);

    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/filing-history?${queryParams.toString()}`;
    logger.info(`Calling monitor API: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Filing history retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch filing history', {
      error: error.message,
      stack: error.stack,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || error.message || 'Failed to fetch filing history',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
}));

// GET /api/admin/collections/download-file/:fileReference - Download BBC6 file
collectionsRouter.get('/download-file/:fileReference', asyncHandler(async (req, res) => {
  const { fileReference } = req.params;
  logger.info('Downloading file', { fileReference });

  try {
    const url = `${config.aiAgentsApiUrl}/api/monitor/collections/download-file/${fileReference}`;

    const response = await axios.get(url, {
      timeout: 30000,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    // Forward headers for file download
    res.setHeader('Content-Type', response.headers['content-type'] || 'text/csv');
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || `attachment; filename="${fileReference}.csv"`);
    
    // Stream the file
    response.data.pipe(res);

  } catch (error: any) {
    logger.error('Failed to download file', {
      error: error.message,
      fileReference,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || error.message || 'Failed to download file',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
}));

// GET /api/admin/collections/health - Health check
collectionsRouter.get('/health', asyncHandler(async (req, res) => {
  res.json({
    status: 'ok',
    service: 'collections-middleware',
    timestamp: new Date().toISOString(),
  });
}));
