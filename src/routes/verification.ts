import { Router } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/error-handler';
import { requireModule } from '../middleware/auth';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';

export const verificationRouter = Router();

// Monitor API base URL (from environment or config)
const MONITOR_API_URL = process.env.MONITOR_API_URL || 'http://localhost:5000';

// All verification routes require the verification module permission
verificationRouter.use(requireModule('verification'));

// GET /api/admin/verifications/queue/needs-review - Tab 1 action queue
verificationRouter.get('/queue/needs-review', asyncHandler(async (req, res) => {
  logger.info('Loading review queue', { userId: req.user?.id });
  const response = await axios.get(`${MONITOR_API_URL}/api/verifications/queue/needs-review`);
  res.json({ data: response.data, message: 'Review queue loaded', timestamp: new Date().toISOString() });
}));

// GET /api/admin/verifications/queue/needs-redo - Tab 2 action queue
verificationRouter.get('/queue/needs-redo', asyncHandler(async (req, res) => {
  logger.info('Loading redo queue', { userId: req.user?.id });
  const response = await axios.get(`${MONITOR_API_URL}/api/verifications/queue/needs-redo`);
  res.json({ data: response.data, message: 'Redo queue loaded', timestamp: new Date().toISOString() });
}));

// GET /api/admin/verifications - List verifications
verificationRouter.get('/', asyncHandler(async (req, res) => {
  logger.info('Listing verifications', { 
    userId: req.user?.id,
    query: req.query 
  });

  const response = await axios.get(`${MONITOR_API_URL}/api/verifications`, {
    params: req.query
  });

  const apiResponse: APIResponse = {
    data: response.data,
    message: 'Verifications retrieved successfully',
    timestamp: new Date().toISOString(),
  };

  res.json(apiResponse);
}));

// GET /api/admin/verifications/agent-status - Kill-switch status
verificationRouter.get('/agent-status', asyncHandler(async (req, res) => {
  const response = await axios.get(`${MONITOR_API_URL}/api/verifications/agent-status`, {
    headers: { 'X-Admin-Secret': process.env.ADMIN_SECRET || '' }
  });
  res.json({ data: response.data, message: 'Agent status retrieved', timestamp: new Date().toISOString() });
}));

// POST /api/admin/verifications/agent-toggle - Flip kill-switch
verificationRouter.post('/agent-toggle', asyncHandler(async (req, res) => {
  logger.info('Toggling verification agent kill switch', { userId: req.user?.id, body: req.body });
  const response = await axios.post(
    `${MONITOR_API_URL}/api/verifications/agent-toggle`,
    req.body,
    { headers: { 'X-Admin-Secret': process.env.ADMIN_SECRET || '' } }
  );
  res.json({ data: response.data, message: 'Agent toggled', timestamp: new Date().toISOString() });
}));

// GET /api/admin/verifications/:customerId - Get verification detail
verificationRouter.get('/:customerId', asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  
  logger.info('Getting verification detail', { 
    userId: req.user?.id,
    customerId 
  });

  const response = await axios.get(`${MONITOR_API_URL}/api/verifications/${customerId}`);

  const apiResponse: APIResponse = {
    data: response.data,
    message: 'Verification detail retrieved successfully',
    timestamp: new Date().toISOString(),
  };

  res.json(apiResponse);
}));

// GET /api/admin/verifications/:customerId/live-status - Fetch live identity status from MySQL
verificationRouter.get('/:customerId/live-status', asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { market } = req.query;

  logger.info('Fetching live identity status', { userId: req.user?.id, customerId });

  const response = await axios.get(
    `${MONITOR_API_URL}/api/verifications/${customerId}/live-status`,
    { params: { market } }
  );

  const apiResponse: APIResponse = {
    data: response.data,
    message: 'Live status retrieved successfully',
    timestamp: new Date().toISOString(),
  };

  res.json(apiResponse);
}));

// POST /api/admin/verifications/:customerId/override - Override verification decision
// Requires special override permission
verificationRouter.post('/:customerId/override',
  requireModule('verification'),
  asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const { new_decision, reason, notes } = req.body;
    
    // Add admin email from authenticated user
    const requestData = {
      ...req.body,
      admin_email: req.user?.email || req.user?.id
    };
    
    logger.info('Overriding verification', { 
      userId: req.user?.id,
      customerId,
      newDecision: new_decision,
      reason
    });

    const response = await axios.post(
      `${MONITOR_API_URL}/api/verifications/${customerId}/override`,
      requestData
    );

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Verification overridden successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// PUT /api/admin/verifications/:customerId - Update customer data
// Requires edit permission
verificationRouter.put('/:customerId',
  requireModule('verification'),
  asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    
    // Add admin email from authenticated user
    const requestData = {
      ...req.body,
      admin_email: req.user?.email || req.user?.id
    };
    
    logger.info('Updating customer data', { 
      userId: req.user?.id,
      customerId,
      fields: Object.keys(req.body)
    });

    const response = await axios.put(
      `${MONITOR_API_URL}/api/verifications/${customerId}`,
      requestData
    );

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Customer data updated successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// POST /api/admin/verifications/:customerId/rerun - Rerun verification
verificationRouter.post('/:customerId/rerun',
  requireModule('verification'),
  asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    
    // Add admin email from authenticated user
    const requestData = {
      ...req.body,
      admin_email: req.user?.email || req.user?.id
    };
    
    logger.info('Rerunning verification', { 
      userId: req.user?.id,
      customerId
    });

    const response = await axios.post(
      `${MONITOR_API_URL}/api/verifications/${customerId}/rerun`,
      requestData
    );

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Verification rerun triggered successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);
  })
);

// GET /api/admin/verifications/analytics - Get verification analytics
verificationRouter.get('/analytics/data', asyncHandler(async (req, res) => {
  logger.info('Getting verification analytics', { 
    userId: req.user?.id,
    query: req.query 
  });

  const response = await axios.get(`${MONITOR_API_URL}/api/verifications/analytics`, {
    params: req.query
  });

  const apiResponse: APIResponse = {
    data: response.data,
    message: 'Analytics retrieved successfully',
    timestamp: new Date().toISOString(),
  };

  res.json(apiResponse);
}));

// GET /api/admin/verifications/analytics/export - Export CSV
verificationRouter.get('/analytics/export', asyncHandler(async (req, res) => {
  logger.info('Exporting verification data', { 
    userId: req.user?.id,
    query: req.query 
  });

  const response = await axios.get(`${MONITOR_API_URL}/api/verifications/analytics/export`, {
    params: req.query,
    responseType: 'text'
  });

  // Forward CSV response
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=verifications_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(response.data);
}));
