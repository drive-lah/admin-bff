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
import { DatabaseMigrations } from './database/migrations';

// Routes
import { aiAgentsRouter } from './routes/ai-agents';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { financeRouter } from './routes/finance';
import { usersRouter } from './routes/users';

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

// Protected routes (require authentication)
app.use('/api/admin', authMiddleware);
app.use('/api/admin/ai-agents', aiAgentsRouter);
app.use('/api/admin/finance', financeRouter);

// User management routes (require user management permissions)
app.use('/api/admin/users', authenticateToken, requireUserManagement, usersRouter);

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
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;