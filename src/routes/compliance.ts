import { Router } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { config } from '../config/config';

// Thin proxy to compliance-service (owns the compliance.* schema in
// collections-db). admin-bff adds auth + module access; the service holds the
// data and logic. Forwards method, subpath, query and body verbatim.
export const complianceRouter = Router();

const client = axios.create({ baseURL: config.complianceApiUrl, timeout: 15_000 });

complianceRouter.use(asyncHandler(async (req, res) => {
  const url = req.originalUrl.replace(/^\/api\/admin\/compliance/, '') || '/';
  try {
    // Fetch as raw bytes and pass through the upstream content-type, so binary
    // responses (PDFs, images from /documents/:id/content) are not mangled by
    // JSON re-encoding. JSON endpoints round-trip unchanged.
    const upstream = await client.request({
      method: req.method as any,
      url,
      data: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });
    const contentType = upstream.headers['content-type'];
    if (contentType) res.setHeader('Content-Type', contentType);
    const disposition = upstream.headers['content-disposition'];
    if (disposition) res.setHeader('Content-Disposition', disposition);
    res.status(upstream.status).send(Buffer.from(upstream.data));
  } catch (err: any) {
    logger.error('compliance proxy error', { message: err.message, url });
    res.status(502).json({ error: 'compliance-service unreachable', detail: err.message });
  }
}));
