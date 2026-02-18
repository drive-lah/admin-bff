import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';
import axios from 'axios';
import { config } from '../config/config';

export const financeAccountingRouter = Router();

const FINANCE_API_BASE = () => `${config.financeApiUrl}/api/finance`;

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
// Transactions
// ---------------------------------------------------------------------------

// POST /accounting/transactions/import (multipart/form-data CSV upload)
financeAccountingRouter.post('/accounting/transactions/import', asyncHandler(async (req: any, res: any) => {
  logger.info('Importing transactions via finance API');
  try {
    const url = `${FINANCE_API_BASE()}/transactions/import`;
    const response = await axios.post(url, req.body, {
      timeout: 60000,
      headers: {
        ...req.headers,
        host: undefined,
      },
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
