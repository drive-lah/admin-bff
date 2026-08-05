import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';
import axios from 'axios';
import { config } from '../config/config';
import multer from 'multer';
import FormData from 'form-data';
import { UserRegistryService } from '../services/user-registry';
import { requireModuleAccess } from '../middleware/auth-enhanced';

const upload = multer({ storage: multer.memoryStorage() });

export const financeAccountingRouter = Router();

const FINANCE_API_BASE = () => `${config.financeApiUrl}/api/finance`;
const ACCOUNTING_API_BASE = () => `${config.financeApiUrl}/api/accounting`;
const HR_API_BASE = () => `${config.financeApiUrl}/api/hr`;
const JOBS_API_BASE = () => `${config.financeApiUrl}/api/jobs`;

const defaultHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
};

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

// GET /accounting/entities
financeAccountingRouter.get('/accounting/entities', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching entities from finance API');
  try {
    const url = `${FINANCE_API_BASE()}/entities`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Entities retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch entities', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve entities',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/entities
financeAccountingRouter.post('/accounting/entities', asyncHandler(async (req: any, res: any) => {
  logger.info('Creating entity in finance API');
  try {
    const url = `${FINANCE_API_BASE()}/entities`;
    const response = await axios.post(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Entity created successfully',
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to create entity', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to create entity',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/entities/:id
financeAccountingRouter.get('/accounting/entities/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching entity by id from finance API', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/entities/${req.params.id}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Entity retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch entity', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve entity',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// PUT /accounting/entities/:id
financeAccountingRouter.put('/accounting/entities/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Updating entity in finance API', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/entities/${req.params.id}`;
    const response = await axios.put(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Entity updated successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to update entity', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to update entity',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// Chart of Accounts
// ---------------------------------------------------------------------------

// GET /accounting/accounts
financeAccountingRouter.get('/accounting/accounts', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching accounts from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/accounts`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.type && { type: req.query.type }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Accounts retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch accounts', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve accounts',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/accounts
financeAccountingRouter.post('/accounting/accounts', asyncHandler(async (req: any, res: any) => {
  logger.info('Creating account in finance API');
  try {
    const url = `${FINANCE_API_BASE()}/accounts`;
    const response = await axios.post(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Account created successfully',
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to create account', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to create account',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/accounts/:id
financeAccountingRouter.get('/accounting/accounts/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching account by id from finance API', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/accounts/${req.params.id}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Account retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch account', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve account',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// PUT /accounting/accounts/:id
financeAccountingRouter.put('/accounting/accounts/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Updating account in finance API', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/accounts/${req.params.id}`;
    const response = await axios.put(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Account updated successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to update account', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to update account',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// Bank Accounts
// ---------------------------------------------------------------------------

// GET /accounting/bank-accounts
financeAccountingRouter.get('/accounting/bank-accounts', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching bank accounts from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/bank-accounts`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Bank accounts retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch bank accounts', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve bank accounts',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/bank-accounts
financeAccountingRouter.post('/accounting/bank-accounts', asyncHandler(async (req: any, res: any) => {
  logger.info('Creating bank account in finance API');
  try {
    const url = `${FINANCE_API_BASE()}/bank-accounts`;
    const response = await axios.post(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Bank account created successfully',
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to create bank account', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to create bank account',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/bank-accounts/:id
financeAccountingRouter.get('/accounting/bank-accounts/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching bank account by id from finance API', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/bank-accounts/${req.params.id}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Bank account retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch bank account', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve bank account',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// Wise Integration
// ---------------------------------------------------------------------------

// GET /accounting/bank-accounts/wise/profiles
financeAccountingRouter.get('/accounting/bank-accounts/wise/profiles', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/bank-accounts/wise/profiles`
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders })
    res.json({ data: response.data, message: 'Wise profiles retrieved', timestamp: new Date().toISOString() })
  } catch (error: any) {
    logger.error('Failed to fetch Wise profiles', { error: error.message })
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to fetch Wise profiles', statusCode: error.response?.status || 500, timestamp: new Date().toISOString() } })
  }
}))

// POST /accounting/bank-accounts/wise/connect
financeAccountingRouter.post('/accounting/bank-accounts/wise/connect', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/bank-accounts/wise/connect`
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders })
    res.json({ data: response.data, message: 'Wise connect completed', timestamp: new Date().toISOString() })
  } catch (error: any) {
    logger.error('Failed to connect Wise', { error: error.message })
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to connect Wise', statusCode: error.response?.status || 500, timestamp: new Date().toISOString() } })
  }
}))

// POST /accounting/bank-accounts/:id/sync
financeAccountingRouter.post('/accounting/bank-accounts/:id/sync', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/bank-accounts/${req.params.id}/sync`
    const response = await axios.post(url, req.body || {}, { timeout: 60000, headers: defaultHeaders })
    res.json({ data: response.data, message: 'Sync completed', timestamp: new Date().toISOString() })
  } catch (error: any) {
    logger.error('Failed to sync bank account', { error: error.message, id: req.params.id })
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to sync bank account', statusCode: error.response?.status || 500, timestamp: new Date().toISOString() } })
  }
}))

// ---------------------------------------------------------------------------
// DBS PDF Import
// ---------------------------------------------------------------------------

// POST /accounting/bank-accounts/dbs/import (multipart/form-data PDF upload)
financeAccountingRouter.post('/accounting/bank-accounts/dbs/import', upload.single('file'), asyncHandler(async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided', statusCode: 400 } })
    }
    if (!req.body.entity_id) {
      return res.status(400).json({ error: { message: 'entity_id is required', statusCode: 400 } })
    }

    const formData = new FormData()
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'statement.pdf',
      contentType: 'application/pdf',
    })
    formData.append('entity_id', req.body.entity_id)

    const url = `${FINANCE_API_BASE()}/bank-accounts/dbs/import`
    const response = await axios.post(url, formData, {
      timeout: 60000,
      headers: { ...formData.getHeaders(), 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    })
    res.json({ data: response.data, message: 'DBS import completed', timestamp: new Date().toISOString() })
  } catch (error: any) {
    logger.error('Failed to import DBS statement', { error: error.message })
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to import DBS statement', statusCode: error.response?.status || 500, timestamp: new Date().toISOString() } })
  }
}))

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

// GET /accounting/transactions
financeAccountingRouter.get('/accounting/transactions', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching transactions from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/transactions`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.bank_account_id && { bank_account_id: req.query.bank_account_id }),
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.counterparty_id && { counterparty_id: req.query.counterparty_id }),
        ...(req.query.status && { status: req.query.status }),
        ...(req.query.date_from && { date_from: req.query.date_from }),
        ...(req.query.date_to && { date_to: req.query.date_to }),
        ...(req.query.search && { search: req.query.search }),
        ...(req.query.journal_entry_id && { journal_entry_id: req.query.journal_entry_id }),
        ...(req.query.amount_min && { amount_min: req.query.amount_min }),
        ...(req.query.amount_max && { amount_max: req.query.amount_max }),
        ...(req.query.sort_by && { sort_by: req.query.sort_by }),
        ...(req.query.sort_dir && { sort_dir: req.query.sort_dir }),
        ...(req.query.limit && { limit: req.query.limit }),
        ...(req.query.offset && { offset: req.query.offset }),
      },
    });
    // Re-expose the finance API's exact total count to the browser.
    const totalCount = response.headers['x-total-count'];
    if (totalCount !== undefined) {
      res.set('X-Total-Count', String(totalCount));
      res.set('Access-Control-Expose-Headers', 'X-Total-Count');
    }
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Transactions retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch transactions', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve transactions',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/transactions/:id
financeAccountingRouter.get('/accounting/transactions/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching transaction by id', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/transactions/${req.params.id}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Transaction retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch transaction', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve transaction',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/transactions/:id/approve
financeAccountingRouter.post('/accounting/transactions/:id/approve', asyncHandler(async (req: any, res: any) => {
  logger.info('Approving transaction', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/transactions/${req.params.id}/approve`;
    const response = await axios.post(url, {}, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Transaction approved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to approve transaction', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to approve transaction',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/transactions/:id/reject
financeAccountingRouter.post('/accounting/transactions/:id/reject', asyncHandler(async (req: any, res: any) => {
  logger.info('Rejecting transaction', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/transactions/${req.params.id}/reject`;
    const response = await axios.post(url, {}, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Transaction rejected successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to reject transaction', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to reject transaction',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/transactions/:id/resolve-needs-review
financeAccountingRouter.post('/accounting/transactions/:id/resolve-needs-review', asyncHandler(async (req: any, res: any) => {
  logger.info('Resolving needs-review transaction', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/transactions/${req.params.id}/resolve-needs-review`;
    const response = await axios.post(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Transaction resolved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to resolve needs-review transaction', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to resolve transaction',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/transactions/bulk
financeAccountingRouter.post('/accounting/transactions/bulk', asyncHandler(async (req: any, res: any) => {
  logger.info('Running bulk transaction action via finance API', { action: req.body?.action, count: req.body?.ids?.length });
  try {
    const url = `${FINANCE_API_BASE()}/transactions/bulk`;
    // run_categorization over 500 ids can hold the line for minutes (AI phase);
    // a shorter timeout here aborts the PROXY while finance-api finishes anyway,
    // making the FE report failure for work that succeeded (seen 2026-07-26:
    // 123s run vs 120s timeout).
    const response = await axios.post(url, req.body, {
      timeout: 600000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Bulk transaction action completed',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Bulk transaction action failed', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Bulk transaction action failed',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/transactions/import (multipart/form-data CSV upload)
// multer parses the incoming file into memory, then we reconstruct a new
// multipart request to forward to the finance API.
financeAccountingRouter.post('/accounting/transactions/import', upload.single('file'), asyncHandler(async (req: any, res: any) => {
  logger.info('Importing transactions via finance API');
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided', statusCode: 400 } });
    }
    if (!req.body.bank_account_id) {
      return res.status(400).json({ error: { message: 'bank_account_id is required', statusCode: 400 } });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'transactions.csv',
      contentType: req.file.mimetype || 'text/csv',
    });
    formData.append('bank_account_id', req.body.bank_account_id);
    if (req.body.import_batch_id) {
      formData.append('import_batch_id', req.body.import_batch_id);
    }

    const url = `${FINANCE_API_BASE()}/transactions/import`;
    const response = await axios.post(url, formData, {
      timeout: 60000,
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Transactions imported successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to import transactions', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to import transactions',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/transactions/stripe
financeAccountingRouter.post('/accounting/transactions/stripe', asyncHandler(async (req: any, res: any) => {
  logger.info('Importing Stripe transactions via finance API');
  try {
    const url = `${FINANCE_API_BASE()}/transactions/stripe`;
    const response = await axios.post(url, req.body, {
      timeout: 60000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Stripe transactions imported successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to import Stripe transactions', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to import Stripe transactions',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// Journal Entries
// ---------------------------------------------------------------------------

// GET /accounting/journal-entries
financeAccountingRouter.get('/accounting/journal-entries', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching journal entries from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/journal-entries`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.status && { status: req.query.status }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Journal entries retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch journal entries', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve journal entries',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/journal-entries
financeAccountingRouter.post('/accounting/journal-entries', asyncHandler(async (req: any, res: any) => {
  logger.info('Creating journal entry in finance API');
  try {
    const url = `${FINANCE_API_BASE()}/journal-entries`;
    const response = await axios.post(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Journal entry created successfully',
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to create journal entry', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to create journal entry',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/journal-entries/:id
financeAccountingRouter.get('/accounting/journal-entries/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching journal entry by id from finance API', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/journal-entries/${req.params.id}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Journal entry retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch journal entry', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve journal entry',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/journal-entries/:id/post
financeAccountingRouter.post('/accounting/journal-entries/:id/post', asyncHandler(async (req: any, res: any) => {
  logger.info('Posting journal entry in finance API', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/journal-entries/${req.params.id}/post`;
    const response = await axios.post(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Journal entry posted successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to post journal entry', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to post journal entry',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

// GET /accounting/reconciliation/suggestions
financeAccountingRouter.get('/accounting/reconciliation/suggestions', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching reconciliation suggestions from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/reconciliation/suggestions`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.bank_account_id && { bank_account_id: req.query.bank_account_id }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Reconciliation suggestions retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch reconciliation suggestions', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve reconciliation suggestions',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/reconciliation/confirm
financeAccountingRouter.post('/accounting/reconciliation/confirm', asyncHandler(async (req: any, res: any) => {
  logger.info('Confirming reconciliation in finance API');
  try {
    const url = `${FINANCE_API_BASE()}/reconciliation/confirm`;
    const response = await axios.post(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Reconciliation confirmed successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to confirm reconciliation', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to confirm reconciliation',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

// GET /accounting/reports/trial-balance
financeAccountingRouter.get('/accounting/reports/trial-balance', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching trial balance report from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/reports/trial-balance`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.as_of_date && { as_of_date: req.query.as_of_date }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Trial balance report retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch trial balance report', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve trial balance report',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/reports/pnl
financeAccountingRouter.get('/accounting/reports/pnl', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching P&L report from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/reports/pnl`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.date_from && { date_from: req.query.date_from }),
        ...(req.query.date_to && { date_to: req.query.date_to }),
        ...(req.query.basis && { basis: req.query.basis }),
        ...(req.query.sgd_usd_rate && { sgd_usd_rate: req.query.sgd_usd_rate }),
        ...(req.query.aud_usd_rate && { aud_usd_rate: req.query.aud_usd_rate }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'P&L report retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch P&L report', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve P&L report',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/reports/balance-sheet
financeAccountingRouter.get('/accounting/reports/balance-sheet', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching balance sheet report from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/reports/balance-sheet`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.date_to && { date_to: req.query.date_to }),
        ...(req.query.basis && { basis: req.query.basis }),
        ...(req.query.sgd_usd_rate && { sgd_usd_rate: req.query.sgd_usd_rate }),
        ...(req.query.aud_usd_rate && { aud_usd_rate: req.query.aud_usd_rate }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Balance sheet report retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch balance sheet report', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve balance sheet report',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/reports/cash-flow
financeAccountingRouter.get('/accounting/reports/cash-flow', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching cash flow report from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/reports/cash-flow`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.date_from && { date_from: req.query.date_from }),
        ...(req.query.date_to && { date_to: req.query.date_to }),
        ...(req.query.basis && { basis: req.query.basis }),
        ...(req.query.sgd_usd_rate && { sgd_usd_rate: req.query.sgd_usd_rate }),
        ...(req.query.aud_usd_rate && { aud_usd_rate: req.query.aud_usd_rate }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Cash flow report retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch cash flow report', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve cash flow report',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/reports/account-ledger
financeAccountingRouter.get('/accounting/reports/account-ledger', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching account ledger from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/reports/account-ledger`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.account_code && { account_code: req.query.account_code }),
        ...(req.query.date_from && { date_from: req.query.date_from }),
        ...(req.query.date_to && { date_to: req.query.date_to }),
        ...(req.query.basis && { basis: req.query.basis }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Account ledger retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch account ledger', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve account ledger',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// Categorization Rules
// ---------------------------------------------------------------------------

// GET /accounting/categorization/rules
financeAccountingRouter.get('/accounting/categorization/rules', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching categorization rules from finance API', { query: req.query });
  try {
    const url = `${FINANCE_API_BASE()}/categorization/rules`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.status && { status: req.query.status }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Categorization rules retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch categorization rules', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve categorization rules',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/categorization/rules
financeAccountingRouter.post('/accounting/categorization/rules', asyncHandler(async (req: any, res: any) => {
  logger.info('Creating categorization rule in finance API');
  try {
    const url = `${FINANCE_API_BASE()}/categorization/rules`;
    const response = await axios.post(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Categorization rule created successfully',
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to create categorization rule', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to create categorization rule',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /accounting/categorization/rules/:id
financeAccountingRouter.get('/accounting/categorization/rules/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching categorization rule by id', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/categorization/rules/${req.params.id}`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Categorization rule retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch categorization rule', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve categorization rule',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// PUT /accounting/categorization/rules/:id
financeAccountingRouter.put('/accounting/categorization/rules/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Updating categorization rule', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/categorization/rules/${req.params.id}`;
    const response = await axios.put(url, req.body, {
      timeout: 30000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Categorization rule updated successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to update categorization rule', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to update categorization rule',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// DELETE /accounting/categorization/rules/:id
financeAccountingRouter.delete('/accounting/categorization/rules/:id', asyncHandler(async (req: any, res: any) => {
  logger.info('Deleting categorization rule', { id: req.params.id });
  try {
    const url = `${FINANCE_API_BASE()}/categorization/rules/${req.params.id}`;
    const response = await axios.delete(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Categorization rule deleted successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to delete categorization rule', { error: error.message, id: req.params.id });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to delete categorization rule',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/categorization/run
financeAccountingRouter.post('/accounting/categorization/run', asyncHandler(async (req: any, res: any) => {
  logger.info('Running categorization engine', { body: req.body });
  try {
    const url = `${FINANCE_API_BASE()}/categorization/run`;
    const response = await axios.post(url, req.body, {
      timeout: 60000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Categorization engine run completed',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to run categorization engine', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to run categorization engine',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/categorization/manual
financeAccountingRouter.post('/accounting/categorization/manual', asyncHandler(async (req: any, res: any) => {
  logger.info('Manual categorization', { transaction_id: req.body?.transaction_id });
  try {
    const url = `${FINANCE_API_BASE()}/categorization/manual`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Transaction categorized', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    logger.error('Manual categorization failed', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: { message: error.response?.data?.error || 'Manual categorization failed', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method },
    });
  }
}));

// ---------------------------------------------------------------------------
// Counterparties
// ---------------------------------------------------------------------------

// B5 (#8): employee/investor counterparty accounts are admin-only. Tell finance-api whether
// the caller may see restricted categories. Admin role (or super-admin) → full access.
function cpHeaders(req: any) {
  const isAdmin = req.user?.permissions?.role === 'admin';
  return { ...defaultHeaders, 'X-CP-Restricted-Access': isAdmin ? '1' : '0' };
}

// GET /accounting/counterparties
financeAccountingRouter.get('/accounting/counterparties', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/counterparties`;
    const response = await axios.get(url, { timeout: 30000, headers: cpHeaders(req), params: req.query });
    res.json({ data: response.data, message: 'Counterparties retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve counterparties', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/counterparties
financeAccountingRouter.post('/accounting/counterparties', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/counterparties`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.status(201).json({ data: response.data, message: 'Counterparty created', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to create counterparty', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// GET /accounting/counterparties/:id
financeAccountingRouter.get('/accounting/counterparties/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/counterparties/${req.params.id}`;
    const response = await axios.get(url, { timeout: 30000, headers: cpHeaders(req) });
    res.json({ data: response.data, message: 'Counterparty retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve counterparty', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// GET /accounting/counterparties/:id/statement
// Vendor-level Statement of Account (summary + aging + chronological lines with paid dates)
financeAccountingRouter.get('/accounting/counterparties/:id/statement', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/counterparties/${req.params.id}/statement`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: cpHeaders(req),
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
      },
    });
    res.json({ data: response.data, message: 'Counterparty statement retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to retrieve counterparty statement', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// PUT /accounting/counterparties/:id
financeAccountingRouter.put('/accounting/counterparties/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/counterparties/${req.params.id}`;
    const response = await axios.put(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Counterparty updated', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to update counterparty', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// DELETE /accounting/counterparties/:id
financeAccountingRouter.delete('/accounting/counterparties/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/counterparties/${req.params.id}`;
    const response = await axios.delete(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Counterparty deleted', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to delete counterparty', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/counterparties/sync/employees
// Fetches all internal users from user registry and upserts them into finance counterparties
financeAccountingRouter.post('/accounting/counterparties/sync/employees', asyncHandler(async (req: any, res: any) => {
  logger.info('Starting employee sync into finance counterparties');
  try {
    const userRegistry = new UserRegistryService();
    const users = await userRegistry.getAllUsers();

    const employees = users.map((u) => ({
      external_system: 'user_registry',
      external_id: String(u.id),
      name: u.name,
      email: u.email,
      phone: u.phone_number ?? null,
      status: u.status === 'active' ? 'active' : 'inactive',
    }));

    const url = `${FINANCE_API_BASE()}/counterparties/sync/employees`;
    const response = await axios.post(url, { employees }, { timeout: 60000, headers: defaultHeaders });

    const apiResponse: APIResponse = {
      data: response.data,
      message: `Employee sync complete: ${response.data.created} created, ${response.data.updated} updated`,
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Employee sync failed', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Employee sync failed',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

// GET /accounting/invoices
financeAccountingRouter.get('/accounting/invoices', asyncHandler(async (req: any, res: any) => {
  try {
    const passthrough = ['entity_id','status','counterparty_id','search','vendor_flag','coa_flag',
      'document_gate','currency_flag','retool_status','sub_category','amount_match','provisional_paid',
      'retool_id','is_duplicate','amount_min','amount_max','paired','limit','offset'];
    const params = new URLSearchParams();
    for (const k of passthrough) { if (req.query[k]) params.append(k, req.query[k] as string); }
    const url = `${FINANCE_API_BASE()}/invoices${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    const totalCount = response.headers['x-total-count'];
    if (totalCount !== undefined) {
      res.set('X-Total-Count', String(totalCount));
      res.set('Access-Control-Expose-Headers', 'X-Total-Count');
    }
    res.json({ data: response.data, message: 'Invoices retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve invoices', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// GET /accounting/invoices/matches — invoice↔payment matches for a counterparty
financeAccountingRouter.get('/accounting/invoices/matches', asyncHandler(async (req: any, res: any) => {
  try {
    const params = new URLSearchParams();
    if (req.query.counterparty_id) params.append('counterparty_id', req.query.counterparty_id as string);
    const url = `${FINANCE_API_BASE()}/invoices/matches${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Matches retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve matches', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/invoices/matches — create a provisional match
financeAccountingRouter.post('/accounting/invoices/matches', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/invoices/matches`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.status(201).json({ data: response.data, message: 'Match created', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error?.message || 'Failed to create match', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// DELETE /accounting/invoices/matches/:id — detach
financeAccountingRouter.delete('/accounting/invoices/matches/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/invoices/matches/${req.params.id}`;
    const response = await axios.delete(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Match detached', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error?.message || 'Failed to detach match', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/invoices
financeAccountingRouter.post('/accounting/invoices', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/invoices`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.status(201).json({ data: response.data, message: 'Invoice created', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to create invoice', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// GET /accounting/invoices/:id
financeAccountingRouter.get('/accounting/invoices/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/invoices/${req.params.id}`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Invoice retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve invoice', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// PUT /accounting/invoices/:id
financeAccountingRouter.put('/accounting/invoices/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/invoices/${req.params.id}`;
    const response = await axios.put(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Invoice updated', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to update invoice', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/invoices/:id/approve
financeAccountingRouter.post('/accounting/invoices/:id/approve', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/invoices/${req.params.id}/approve`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Invoice approved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to approve invoice', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/invoices/:id/reject
financeAccountingRouter.post('/accounting/invoices/:id/reject', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/invoices/${req.params.id}/reject`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Invoice rejected', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to reject invoice', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/invoices/:id/void
financeAccountingRouter.post('/accounting/invoices/:id/void', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/invoices/${req.params.id}/void`;
    // Forward the caller's body — finance-api REQUIRES void_reason (400 without it).
    const response = await axios.post(url, req.body || {}, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Invoice voided', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to void invoice', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/invoices/extract (PDF upload for AI extraction)
financeAccountingRouter.post('/accounting/invoices/extract', upload.single('file'), asyncHandler(async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided', statusCode: 400, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
    }
    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
    const url = `${FINANCE_API_BASE()}/invoices/extract`;
    const response = await axios.post(url, formData, { timeout: 60000, headers: { ...formData.getHeaders(), 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' } });
    res.json({ data: response.data, message: 'Invoice data extracted', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to extract invoice data', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/invoices/:id/attach (attach a document to an existing invoice/stub)
financeAccountingRouter.post('/accounting/invoices/:id/attach', upload.single('file'), asyncHandler(async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided', statusCode: 400, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
    }
    const { id } = req.params;
    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
    const url = `${FINANCE_API_BASE()}/invoices/${id}/attach`;
    const response = await axios.post(url, formData, { timeout: 60000, headers: { ...formData.getHeaders(), 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' } });
    res.json({ data: response.data, message: 'Document attached', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.response?.data?.error || 'Failed to attach document';
    res.status(error.response?.status || 500).json({ error: { message: msg, statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/invoices/:id/submit (AI contract review gate + approval rules)
financeAccountingRouter.post('/accounting/invoices/:id/submit', asyncHandler(async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const url = `${FINANCE_API_BASE()}/invoices/${id}/submit`;
    const response = await axios.post(url, req.body || {}, { timeout: 30000, headers: { 'Content-Type': 'application/json', 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' } });
    res.json({ data: response.data, message: 'Invoice submitted', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    const msg = error.response?.data?.error || 'Failed to submit invoice';
    res.status(error.response?.status || 500).json({ error: { message: msg, statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

// GET /accounting/contracts
financeAccountingRouter.get('/accounting/contracts', asyncHandler(async (req: any, res: any) => {
  try {
    const params = new URLSearchParams();
    if (req.query.entity_id) params.append('entity_id', req.query.entity_id as string);
    if (req.query.counterparty_id) params.append('counterparty_id', req.query.counterparty_id as string);
    if (req.query.status) params.append('status', req.query.status as string);
    const url = `${FINANCE_API_BASE()}/contracts${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Contracts retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve contracts', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/contracts
financeAccountingRouter.post('/accounting/contracts', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/contracts`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.status(201).json({ data: response.data, message: 'Contract created', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to create contract', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// GET /accounting/contracts/:id
financeAccountingRouter.get('/accounting/contracts/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/contracts/${req.params.id}`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Contract retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve contract', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// PUT /accounting/contracts/:id
financeAccountingRouter.put('/accounting/contracts/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/contracts/${req.params.id}`;
    const response = await axios.put(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Contract updated', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to update contract', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// ---------------------------------------------------------------------------
// Approval Rules
// ---------------------------------------------------------------------------

// GET /accounting/approval-rules
financeAccountingRouter.get('/accounting/approval-rules', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/approval-rules`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Approval rules retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve approval rules', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /accounting/approval-rules
financeAccountingRouter.post('/accounting/approval-rules', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/approval-rules`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.status(201).json({ data: response.data, message: 'Approval rule created', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to create approval rule', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// GET /accounting/approval-rules/:id
financeAccountingRouter.get('/accounting/approval-rules/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/approval-rules/${req.params.id}`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Approval rule retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve approval rule', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// PUT /accounting/approval-rules/:id
financeAccountingRouter.put('/accounting/approval-rules/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/approval-rules/${req.params.id}`;
    const response = await axios.put(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Approval rule updated', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to update approval rule', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// DELETE /accounting/approval-rules/:id
financeAccountingRouter.delete('/accounting/approval-rules/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${FINANCE_API_BASE()}/approval-rules/${req.params.id}`;
    const response = await axios.delete(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Approval rule deleted', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to delete approval rule', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// ---------------------------------------------------------------------------
// Economic Events
// ---------------------------------------------------------------------------

// GET /accounting/economic-events
financeAccountingRouter.get('/accounting/economic-events', asyncHandler(async (req: any, res: any) => {
  logger.info('Fetching economic events from finance API', { query: req.query });
  try {
    const url = `${ACCOUNTING_API_BASE()}/economic-events`;
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Drivelah-Admin-BFF/1.0.0' },
      params: {
        ...(req.query.entity_id && { entity_id: req.query.entity_id }),
        ...(req.query.period && { period: req.query.period }),
        ...(req.query.status && { status: req.query.status }),
      },
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Economic events retrieved successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to fetch economic events', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve economic events',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/economic-events/stage
financeAccountingRouter.post('/accounting/economic-events/stage', asyncHandler(async (req: any, res: any) => {
  logger.info('Staging economic events via finance API', { body: req.body });
  try {
    const url = `${ACCOUNTING_API_BASE()}/economic-events/stage`;
    const response = await axios.post(url, req.body, {
      timeout: 60000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Economic events staged successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to stage economic events', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to stage economic events',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/economic-events/sync
// Stripe "press sync": stage every month in range (STAGED, not posted) + import payouts.
financeAccountingRouter.post('/accounting/economic-events/sync', asyncHandler(async (req: any, res: any) => {
  logger.info('Syncing economic events (stage range + import payouts) via finance API', { body: req.body });
  try {
    const url = `${ACCOUNTING_API_BASE()}/economic-events/sync`;
    const response = await axios.post(url, req.body, {
      timeout: 120000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Economic events synced successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to sync economic events', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to sync economic events',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/economic-events/project
financeAccountingRouter.post('/accounting/economic-events/project', asyncHandler(async (req: any, res: any) => {
  logger.info('Projecting economic events into journal entries via finance API', { body: req.body });
  try {
    const url = `${ACCOUNTING_API_BASE()}/economic-events/project`;
    const response = await axios.post(url, req.body, {
      timeout: 60000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Economic events projected successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to project economic events', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to project economic events',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// POST /accounting/economic-events/import-payouts
financeAccountingRouter.post('/accounting/economic-events/import-payouts', asyncHandler(async (req: any, res: any) => {
  logger.info('Importing payout lines via finance API', { body: req.body });
  try {
    const url = `${ACCOUNTING_API_BASE()}/economic-events/import-payouts`;
    const response = await axios.post(url, req.body, {
      timeout: 60000,
      headers: defaultHeaders,
    });
    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Payout lines imported successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(apiResponse);
  } catch (error: any) {
    logger.error('Failed to import payout lines', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error || 'Failed to import payout lines',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// ---------------------------------------------------------------------------
// HR — Onboarding / Offboarding / Employees
// ---------------------------------------------------------------------------

// HR module is RESTRICTED to the four HR admins only (Gaurav directive 2026-08-05):
// gauravs / dirkjan / zilla (full finance+HR) and rahul (HR admin). This single
// router-level gate locks EVERY /hr/* route below (list/detail/update/compensation/
// onboard/offboard/jobs) to holders of the `hr` module grant — no other staff can
// read or mutate HR data. Mirrors the finance.payouts pattern (BFF is the real gate).
financeAccountingRouter.use('/hr', requireModuleAccess('hr', 'read'));

// GET /hr/employees — list HR employees
financeAccountingRouter.get('/hr/employees', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${HR_API_BASE()}/employees`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders, params: req.query });
    res.json({ data: response.data, message: 'HR employees retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve HR employees', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// GET /hr/employees/:id — get single HR employee
financeAccountingRouter.get('/hr/employees/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${HR_API_BASE()}/employees/${req.params.id}`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'HR employee retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve HR employee', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// PUT /hr/employees/:id — update the full employee record (hr fields + user bank/manager/is_employee)
financeAccountingRouter.put('/hr/employees/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${HR_API_BASE()}/employees/${req.params.id}`;
    const response = await axios.put(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'HR employee updated', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to update HR employee', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// GET /hr/employees/:id/compensation — compensation history
financeAccountingRouter.get('/hr/employees/:id/compensation', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${HR_API_BASE()}/employees/${req.params.id}/compensation`;
    const response = await axios.get(url, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Compensation retrieved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: 'Failed to retrieve compensation', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /hr/employees/:id/compensation — add a compensation record
financeAccountingRouter.post('/hr/employees/:id/compensation', asyncHandler(async (req: any, res: any) => {
  try {
    const url = `${HR_API_BASE()}/employees/${req.params.id}/compensation`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.status(201).json({ data: response.data, message: 'Compensation added', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: { message: error.response?.data?.error || 'Failed to add compensation', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method } });
  }
}));

// POST /hr/onboard/bulk — bulk onboard employees
financeAccountingRouter.post('/hr/onboard/bulk', asyncHandler(async (req: any, res: any) => {
  logger.info('Bulk onboarding employees via HR API');
  try {
    const url = `${HR_API_BASE()}/onboard/bulk`;
    const response = await axios.post(url, req.body, { timeout: 60000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Bulk onboarding complete', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    logger.error('Bulk onboarding failed', { error: error.message });
    const errData = error.response?.data;
    res.status(error.response?.status || 500).json({
      data: errData || null,
      error: { message: errData?.errors?.[0]?.message || 'Bulk onboarding failed', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method },
    });
  }
}));

// POST /hr/onboard/:userId — individual onboard
financeAccountingRouter.post('/hr/onboard/:userId', asyncHandler(async (req: any, res: any) => {
  logger.info(`Individual onboarding user ${req.params.userId} via HR API`);
  try {
    const url = `${HR_API_BASE()}/onboard/${req.params.userId}`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Employee onboarded', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    logger.error(`Individual onboarding failed for user ${req.params.userId}`, { error: error.message });
    res.status(error.response?.status || 500).json({
      error: { message: error.response?.data?.error || 'Onboarding failed', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method },
    });
  }
}));

// POST /hr/offboard/:userId — offboard employee
financeAccountingRouter.post('/hr/offboard/:userId', asyncHandler(async (req: any, res: any) => {
  logger.info(`Offboarding user ${req.params.userId} via HR API`);
  try {
    const url = `${HR_API_BASE()}/offboard/${req.params.userId}`;
    const response = await axios.post(url, req.body, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Employee offboarded', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    logger.error(`Offboarding failed for user ${req.params.userId}`, { error: error.message });
    res.status(error.response?.status || 500).json({
      error: { message: error.response?.data?.error || 'Offboarding failed', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method },
    });
  }
}));

// POST /hr/jobs/sync-employees — trigger employee sync job
financeAccountingRouter.post('/hr/jobs/sync-employees', asyncHandler(async (req: any, res: any) => {
  logger.info('Triggering employee sync job via HR API');
  try {
    const url = `${JOBS_API_BASE()}/sync-employees`;
    const response = await axios.post(url, {}, { timeout: 60000, headers: defaultHeaders });
    res.json({ data: response.data, message: 'Employee sync complete', timestamp: new Date().toISOString() } as APIResponse);
  } catch (error: any) {
    logger.error('Employee sync job failed', { error: error.message });
    res.status(error.response?.status || 500).json({
      error: { message: 'Employee sync failed', statusCode: error.response?.status || 500, timestamp: new Date().toISOString(), path: req.path, method: req.method },
    });
  }
}));

// ===========================================================================
// Vendor Payouts (Wise) — proxies to finance-api /payouts
// Actor identity forwarded for the immutable payout audit trail.
// ===========================================================================
const PAYOUTS_BASE = () => `${config.financeApiUrl}/api/finance/payouts`;
function actorHeaders(req: any) {
  const u = req.user || {};
  return {
    ...defaultHeaders,
    'X-User-Id': String(u.id ?? u.email ?? 'ui'),
    'X-User-Email': String(u.email ?? ''),
    'X-User-Role': String(u.role ?? ''),
    'X-Forwarded-For': (req.headers['x-forwarded-for'] as string) || req.ip || '',
  };
}
function payoutError(res: any, req: any, error: any, msg: string) {
  logger.error(msg, { error: error.message, detail: error.response?.data });
  res.status(error.response?.status || 500).json({
    error: {
      message: error.response?.data?.error || error.response?.data?.message || msg,
      statusCode: error.response?.status || 500, timestamp: new Date().toISOString(),
      path: req.path, method: req.method,
    },
  });
}

// B2 gate (#10 extremely restricted): every payout route requires finance.payouts.
// read minimum to view; the mutating routes additionally require write (below).
financeAccountingRouter.use('/accounting/payouts', requireModuleAccess('finance.payouts', 'read'));

financeAccountingRouter.get('/accounting/payouts/config', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${PAYOUTS_BASE()}/config`, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to load payout config'); }
}));

financeAccountingRouter.get('/accounting/payouts/source-accounts', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${PAYOUTS_BASE()}/source-accounts`, {
      timeout: 30000, headers: defaultHeaders, params: { entity_id: req.query.entity_id } });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to load source accounts'); }
}));

financeAccountingRouter.get('/accounting/payouts/payable-invoices', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${PAYOUTS_BASE()}/payable-invoices`, {
      timeout: 30000, headers: defaultHeaders, params: { entity_id: req.query.entity_id } });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to load payable invoices'); }
}));

financeAccountingRouter.get('/accounting/payouts', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${PAYOUTS_BASE()}`, {
      timeout: 30000, headers: defaultHeaders,
      params: { state: req.query.state, entity_id: req.query.entity_id } });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to list payouts'); }
}));

financeAccountingRouter.get('/accounting/payouts/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${PAYOUTS_BASE()}/${req.params.id}`, { timeout: 30000, headers: defaultHeaders });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to get payout'); }
}));

financeAccountingRouter.post('/accounting/payouts', requireModuleAccess('finance.payouts', 'write'), asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.post(`${PAYOUTS_BASE()}`, req.body, { timeout: 60000, headers: actorHeaders(req) });
    res.status(201).json({ data: r.data, message: 'Payout raised', timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to raise payout'); }
}));

financeAccountingRouter.post('/accounting/payouts/:id/approve', requireModuleAccess('finance.payouts', 'admin'), asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.post(`${PAYOUTS_BASE()}/${req.params.id}/approve`, {}, { timeout: 60000, headers: actorHeaders(req) });
    res.json({ data: r.data, message: 'Payout approved', timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to approve payout'); }
}));

financeAccountingRouter.post('/accounting/payouts/:id/cancel', requireModuleAccess('finance.payouts', 'write'), asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.post(`${PAYOUTS_BASE()}/${req.params.id}/cancel`, req.body || {}, { timeout: 30000, headers: actorHeaders(req) });
    res.json({ data: r.data, message: 'Payout cancelled', timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to cancel payout'); }
}));

// ── Unified payee bank accounts (counterparties + employees) ──────────────────
const PAYEE_BANK_BASE = () => `${config.financeApiUrl}/api/finance/payee-bank-accounts`;
financeAccountingRouter.get('/accounting/payee-bank-accounts', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${PAYEE_BANK_BASE()}`, { timeout: 30000, headers: defaultHeaders,
      params: { payee_type: req.query.payee_type, payee_id: req.query.payee_id, entity_id: req.query.entity_id } });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to list bank accounts'); }
}));
financeAccountingRouter.post('/accounting/payee-bank-accounts', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.post(`${PAYEE_BANK_BASE()}`, req.body, { timeout: 30000, headers: actorHeaders(req) });
    res.status(201).json({ data: r.data, message: 'Bank account added', timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to add bank account'); }
}));
financeAccountingRouter.put('/accounting/payee-bank-accounts/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.put(`${PAYEE_BANK_BASE()}/${req.params.id}`, req.body, { timeout: 30000, headers: actorHeaders(req) });
    res.json({ data: r.data, message: 'Bank account updated', timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to update bank account'); }
}));
financeAccountingRouter.delete('/accounting/payee-bank-accounts/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.delete(`${PAYEE_BANK_BASE()}/${req.params.id}`, { timeout: 30000, headers: actorHeaders(req) });
    res.json({ data: r.data, message: 'Bank account deleted', timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to delete bank account'); }
}));

// ── Employee Claims (#5/#6) — own-scoped; forwards caller identity + admin flag ──────────
const CLAIMS_BASE = () => `${config.financeApiUrl}/api/finance/claims`;
function claimHeaders(req: any) {
  const u = req.user || {};
  return {
    ...defaultHeaders,
    'X-User-Id': String(u.id ?? ''),
    'X-Is-Admin': (u.permissions?.role === 'admin') ? '1' : '0',
  };
}
// Any employee with finance.expenses (own) can use claims; finance-api enforces own-scoping.
financeAccountingRouter.use('/accounting/claims', requireModuleAccess('finance.expenses', 'own'));

financeAccountingRouter.get('/accounting/claims', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${CLAIMS_BASE()}`, { timeout: 30000, headers: claimHeaders(req),
      params: { status: req.query.status, mine_only: req.query.mine_only } });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to list claims'); }
}));
financeAccountingRouter.post('/accounting/claims', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.post(`${CLAIMS_BASE()}`, req.body, { timeout: 30000, headers: claimHeaders(req) });
    res.status(201).json({ data: r.data, message: 'Claim created', timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to create claim'); }
}));
financeAccountingRouter.get('/accounting/claims/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${CLAIMS_BASE()}/${req.params.id}`, { timeout: 30000, headers: claimHeaders(req) });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to get claim'); }
}));
for (const action of ['submit', 'approve', 'reject']) {
  financeAccountingRouter.post(`/accounting/claims/:id/${action}`, asyncHandler(async (req: any, res: any) => {
    try {
      const r = await axios.post(`${CLAIMS_BASE()}/${req.params.id}/${action}`, req.body || {}, { timeout: 30000, headers: claimHeaders(req) });
      res.json({ data: r.data, message: `Claim ${action}`, timestamp: new Date().toISOString() } as APIResponse);
    } catch (e: any) { payoutError(res, req, e, `Failed to ${action} claim`); }
  }));
}

// ── My Tasks (company-wide inbox) — own-scoped; forwards caller id, admin flag, roles ──────
const TASKS_BASE = () => `${config.financeApiUrl}/api/finance/tasks`;
function taskHeaders(req: any) {
  const u = req.user || {};
  const modules: string[] = u.permissions?.modules || [];
  return {
    ...defaultHeaders,
    'X-User-Id': String(u.id ?? ''),
    'X-Is-Admin': (u.permissions?.role === 'admin') ? '1' : '0',
    'X-User-Roles': modules.join(','),
  };
}
// Any authenticated finance user can have a task inbox; finance-api enforces own-scoping.
financeAccountingRouter.get('/accounting/tasks', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${TASKS_BASE()}`, { timeout: 30000, headers: taskHeaders(req),
      params: { status: req.query.status } });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to list tasks'); }
}));
financeAccountingRouter.get('/accounting/tasks/count', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${TASKS_BASE()}/count`, { timeout: 30000, headers: taskHeaders(req) });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to count tasks'); }
}));
financeAccountingRouter.get('/accounting/tasks/:id', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.get(`${TASKS_BASE()}/${req.params.id}`, { timeout: 30000, headers: taskHeaders(req) });
    res.json({ data: r.data, timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to get task'); }
}));
financeAccountingRouter.post('/accounting/tasks/:id/act', asyncHandler(async (req: any, res: any) => {
  try {
    const r = await axios.post(`${TASKS_BASE()}/${req.params.id}/act`, req.body || {}, { timeout: 30000, headers: taskHeaders(req) });
    res.json({ data: r.data, message: 'Task actioned', timestamp: new Date().toISOString() } as APIResponse);
  } catch (e: any) { payoutError(res, req, e, 'Failed to action task'); }
}));
