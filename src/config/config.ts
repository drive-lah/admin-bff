import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173', // Frontend dev server
    'https://admin-controls.drivelah.sg', // Production frontend
    'https://*.onrender.com', // Render preview deployments
  ],
  
  // External API URLs
  aiAgentsApiUrl: process.env.AI_AGENTS_API_URL || 'https://monitor-api.onrender.com',
  usersApiUrl: process.env.USERS_API_URL || '',
  listingsApiUrl: process.env.LISTINGS_API_URL || '',
  transactionsApiUrl: process.env.TRANSACTIONS_API_URL || '',
  claimsApiUrl: process.env.CLAIMS_API_URL || '',
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  
  // API Keys and secrets
  internalApiKey: process.env.INTERNAL_API_KEY || 'your-internal-api-key',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Health check
  healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
};

// Validation
const requiredEnvVars = [
  'AI_AGENTS_API_URL',
  'GOOGLE_CLIENT_ID',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0 && config.nodeEnv === 'production') {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

export default config;