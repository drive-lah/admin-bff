// Drivelah Admin BFF Server with User Registry
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler, asyncHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { authenticateToken, requireModuleAccess, requireUserManagement } from './middleware/auth-enhanced';
import { activityLoggingMiddleware } from './middleware/activity-logging';
import { DatabaseMigrations } from './database/migrations';
import { logCleanup } from './services/log-cleanup';

// Routes
import { aiAgentsRouter } from './routes/ai-agents';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { financeRouter } from './routes/finance';
import { usersRouter } from './routes/users';
import { kpisRouter } from './routes/kpis';
import { logsRouter } from './routes/logs';
import { collectionsRouter } from './routes/collections';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Allow Google OAuth popups
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Public routes (no auth required)
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Activity logging middleware for all admin routes (registers AFTER auth in route handlers)
// This middleware captures request/response data for audit logging
app.use('/api/admin', authMiddleware, activityLoggingMiddleware);

// Test endpoint for Google Workspace connection
app.get('/api/test/google-workspace', asyncHandler(async (req, res) => {
  const { GoogleWorkspaceService } = await import('./services/google-workspace');
  const googleService = new GoogleWorkspaceService();

  try {
    const isInitialized = await googleService.isInitialized();
    res.json({
      status: isInitialized ? 'success' : 'error',
      initialized: isInitialized,
      message: isInitialized
        ? 'Google Workspace service initialized successfully. Domain-wide delegation may need to be configured in Google Admin Console.'
        : 'Google Workspace service not initialized',
      serviceAccountId: '108332979752909069482',
      requiredScopes: [
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        'https://www.googleapis.com/auth/admin.directory.group.readonly'
      ],
      instructions: [
        '1. Go to Google Admin Console → Security → API controls → Domain-wide delegation',
        '2. Add authorized client with Client ID: 108332979752909069482',
        '3. Add scopes: https://www.googleapis.com/auth/admin.directory.user.readonly,https://www.googleapis.com/auth/admin.directory.group.readonly',
        '4. Make sure Admin SDK API is enabled in Google Cloud Console'
      ]
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      initialized: false,
      message: error.message,
      error: error.code || 'unknown_error'
    });
  }
}));

// Protected routes with module-level permissions
// AI Agents module - requires 'ai-agents' module access
app.use('/api/admin/ai-agents', authMiddleware, requireModuleAccess('ai-agents', 'read'), aiAgentsRouter);

// Collections/Default Filing module - requires 'ai-agents' module access (part of AI Agents)
app.use('/api/admin/collections', authMiddleware, requireModuleAccess('ai-agents', 'read'), collectionsRouter);

// Finance module - requires 'finance' module access
app.use('/api/admin/finance', authMiddleware, requireModuleAccess('finance', 'read'), financeRouter);

// KPIs endpoint - accessible to users with 'core' or 'host-management' module access
// This is checked within the kpisRouter based on the team parameter
app.use('/api/admin/kpis', authMiddleware, kpisRouter);

// User Management module - requires 'user-mgmt' module access for managing internal admin users
app.use('/api/admin/users', authMiddleware, requireModuleAccess('user-mgmt', 'read'), usersRouter);

// Activity Logs module - requires 'user-mgmt' module access (part of user management)
app.use('/api/admin/logs', authMiddleware, requireModuleAccess('user-mgmt', 'read'), logsRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    logger.info('Initializing database...');
    await DatabaseMigrations.runMigrations();
    await DatabaseMigrations.insertDefaultData();
    logger.info('Database initialized successfully');

    // Start server
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.info(`🚀 Admin BFF Server with User Registry running on port ${PORT}`, {
        environment: config.nodeEnv,
        aiAgentsApiUrl: config.aiAgentsApiUrl,
        database: 'SQLite (User Registry)',
      });
    });

    // Schedule daily log cleanup job (runs at midnight)
    const scheduleCleanup = () => {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0, 0
      );
      const timeUntilMidnight = midnight.getTime() - now.getTime();

      // Run first cleanup at next midnight
      setTimeout(async () => {
        try {
          await logCleanup.deleteOldLogs();
        } catch (error) {
          logger.error('Log cleanup job failed', { error });
        }

        // Then run daily
        setInterval(async () => {
          try {
            await logCleanup.deleteOldLogs();
          } catch (error) {
            logger.error('Log cleanup job failed', { error });
          }
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, timeUntilMidnight);

      logger.info('Log cleanup job scheduled', {
        nextRunAt: midnight.toISOString()
      });
    };

    scheduleCleanup();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


export default app;