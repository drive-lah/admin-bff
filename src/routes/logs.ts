// Activity logs API routes
import { Router, Request, Response } from 'express';
import { db } from '../database/database';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { ActivityLog, LogFilter, PaginatedLogs } from '../types/logs';

export const logsRouter = Router();

/**
 * GET /api/admin/logs
 * Get paginated activity logs with filtering, search, and sorting
 */
logsRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    email,
    actionType,
    module,
    status,
    ipAddress,
    startDate,
    endDate,
    search,
    page = '1',
    limit = '50',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  // Parse pagination params
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50)); // Max 100 per page
  const offset = (pageNum - 1) * limitNum;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(parseInt(userId as string));
  }

  if (email) {
    conditions.push(`email ILIKE $${paramIndex++}`);
    params.push(`%${email}%`);
  }

  if (actionType) {
    conditions.push(`action_type = $${paramIndex++}`);
    params.push(actionType);
  }

  if (module) {
    conditions.push(`module = $${paramIndex++}`);
    params.push(module);
  }

  if (status) {
    // Status is derived from response_status
    if (status === 'success') {
      conditions.push(`response_status >= 200 AND response_status < 300`);
    } else if (status === 'failure') {
      conditions.push(`(response_status < 200 OR response_status >= 300)`);
    }
  }

  if (ipAddress) {
    conditions.push(`ip_address = $${paramIndex++}`);
    params.push(ipAddress);
  }

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(new Date(startDate as string));
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(new Date(endDate as string));
  }

  if (search) {
    conditions.push(`(
      email ILIKE $${paramIndex} OR
      action_description ILIKE $${paramIndex} OR
      endpoint_path ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Validate sortBy to prevent SQL injection
  const validSortColumns = ['created_at', 'email', 'action_type', 'module', 'response_status'];
  const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
  const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countResult = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM admin_user_logs ${whereClause}`,
    params
  );
  const total = countResult?.count || 0;
  const totalPages = Math.ceil(total / limitNum);

  // Get paginated logs
  const logs = await db.all<ActivityLog>(
    `SELECT * FROM admin_user_logs
     ${whereClause}
     ORDER BY ${sortColumn} ${sortDirection}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limitNum, offset]
  );

  // Parse JSONB fields
  const parsedLogs = logs.map(log => ({
    ...log,
    request_payload: log.request_payload ? (typeof log.request_payload === 'string' ? JSON.parse(log.request_payload) : log.request_payload) : null,
    before_state: log.before_state ? (typeof log.before_state === 'string' ? JSON.parse(log.before_state) : log.before_state) : null,
    after_state: log.after_state ? (typeof log.after_state === 'string' ? JSON.parse(log.after_state) : log.after_state) : null
  }));

  const response: PaginatedLogs = {
    logs: parsedLogs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  };

  res.json(response);
}));

/**
 * GET /api/admin/logs/:id
 * Get a single log entry by ID
 */
logsRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const log = await db.get<ActivityLog>(
    'SELECT * FROM admin_user_logs WHERE id = $1',
    [id]
  );

  if (!log) {
    return res.status(404).json({
      error: 'Log entry not found',
      timestamp: new Date().toISOString()
    });
  }

  // Parse JSONB fields
  const parsedLog = {
    ...log,
    request_payload: log.request_payload ? (typeof log.request_payload === 'string' ? JSON.parse(log.request_payload) : log.request_payload) : null,
    before_state: log.before_state ? (typeof log.before_state === 'string' ? JSON.parse(log.before_state) : log.before_state) : null,
    after_state: log.after_state ? (typeof log.after_state === 'string' ? JSON.parse(log.after_state) : log.after_state) : null
  };

  res.json(parsedLog);
}));

/**
 * GET /api/admin/logs/export
 * Export logs as CSV or JSON
 */
logsRouter.get('/export/data', asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    email,
    actionType,
    module,
    status,
    ipAddress,
    startDate,
    endDate,
    search,
    format = 'json'
  } = req.query;

  // Build WHERE clause (same as main endpoint)
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(parseInt(userId as string));
  }

  if (email) {
    conditions.push(`email ILIKE $${paramIndex++}`);
    params.push(`%${email}%`);
  }

  if (actionType) {
    conditions.push(`action_type = $${paramIndex++}`);
    params.push(actionType);
  }

  if (module) {
    conditions.push(`module = $${paramIndex++}`);
    params.push(module);
  }

  if (status) {
    if (status === 'success') {
      conditions.push(`response_status >= 200 AND response_status < 300`);
    } else if (status === 'failure') {
      conditions.push(`(response_status < 200 OR response_status >= 300)`);
    }
  }

  if (ipAddress) {
    conditions.push(`ip_address = $${paramIndex++}`);
    params.push(ipAddress);
  }

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(new Date(startDate as string));
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(new Date(endDate as string));
  }

  if (search) {
    conditions.push(`(
      email ILIKE $${paramIndex} OR
      action_description ILIKE $${paramIndex} OR
      endpoint_path ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get logs (limit to 10,000 for export)
  const logs = await db.all<ActivityLog>(
    `SELECT * FROM admin_user_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT 10000`,
    params
  );

  if (logs.length >= 10000) {
    return res.status(400).json({
      error: 'Export result set too large. Please narrow your filters. Maximum 10,000 rows.',
      timestamp: new Date().toISOString()
    });
  }

  // Parse JSONB fields
  const parsedLogs = logs.map(log => ({
    ...log,
    request_payload: log.request_payload ? (typeof log.request_payload === 'string' ? JSON.parse(log.request_payload) : log.request_payload) : null,
    before_state: log.before_state ? (typeof log.before_state === 'string' ? JSON.parse(log.before_state) : log.before_state) : null,
    after_state: log.after_state ? (typeof log.after_state === 'string' ? JSON.parse(log.after_state) : log.after_state) : null
  }));

  if (format === 'csv') {
    // Convert to CSV
    const { Parser } = require('json2csv');

    // Flatten objects for CSV
    const flatLogs = parsedLogs.map(log => ({
      id: log.id,
      user_id: log.user_id,
      email: log.email,
      action_type: log.action_type,
      action_description: log.action_description,
      module: log.module || '',
      http_method: log.http_method || '',
      endpoint_path: log.endpoint_path || '',
      response_status: log.response_status || '',
      response_time_ms: log.response_time_ms || '',
      ip_address: log.ip_address || '',
      user_agent: log.user_agent || '',
      geo_city: log.geo_city || '',
      geo_country: log.geo_country || '',
      created_at: log.created_at
    }));

    const parser = new Parser();
    const csv = parser.parse(flatLogs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${Date.now()}.csv"`);
    res.send(csv);
  } else {
    // Return as JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${Date.now()}.json"`);
    res.json(parsedLogs);
  }

  logger.info('Activity logs exported', {
    userId: req.user?.id,
    email: req.user?.email,
    format,
    count: logs.length
  });
}));
