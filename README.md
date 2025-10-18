# Drivelah Admin BFF (Backend for Frontend)

Backend for Frontend service for the Drivelah Admin Portal, providing a unified API layer for multiple microservices.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Portal  │    │   Admin BFF     │    │  AI Agents API  │
│   (Frontend)    │────│   (This Service)│────│                 │
│                 │    │                 │    └─────────────────┘
│                 │    │ • Authentication│    ┌─────────────────┐
│                 │    │ • Authorization │────│   Users API     │
│                 │    │ • Data Proxy    │    └─────────────────┘
│                 │    │ • Rate Limiting │    ┌─────────────────┐
└─────────────────┘    └─────────────────┘    │   Other APIs    │
                                               └─────────────────┘
```

## Features

- 🔐 **JWT-based Authentication** with Google OAuth integration
- 🛡️ **Role-based Access Control** (Admin, Manager, Viewer)
- 🚀 **API Proxy & Aggregation** for multiple backend services
- 📝 **Request/Response Logging** with Winston
- ⚡ **Rate Limiting** and security middleware
- 🏥 **Health Checks** for monitoring
- 🔄 **Error Handling** with proper HTTP status codes

## 📚 Documentation

**Complete system documentation is available in the backend repository:**

👉 **[Unified Documentation](https://github.com/drivelah/new-monitor-api/tree/main/documentation)**

Or locally at: `../new-monitor-api/documentation/`

### Key Documentation
- **[Master Index](../new-monitor-api/documentation/README.md)** - Start here for complete navigation
- **[Architecture Guide](../new-monitor-api/documentation/ARCHITECTURE.md)** - Middleware layer details
- **[API Reference](../new-monitor-api/documentation/API_REFERENCE.md)** - All BFF endpoints documented
- **[Permission System](../new-monitor-api/documentation/PERMISSION_SYSTEM.md)** - Complete permission guide
- **[Development Guide](../new-monitor-api/documentation/DEVELOPMENT_GUIDE.md)** - Setup instructions

> The documentation covers the entire Admin System (Frontend, Middleware, Backend) in one unified location.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/google` - Authenticate with Google OAuth
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout

### AI Agents (Protected)
- `GET /api/admin/ai-agents` - List all agents
- `GET /api/admin/ai-agents/:id` - Get agent details
- `PUT /api/admin/ai-agents/:id` - Update agent
- `POST /api/admin/ai-agents/:id/actions` - Perform agent action
- `GET /api/admin/ai-agents/:id/logs` - Get agent logs
- `GET /api/admin/ai-agents/:id/metrics` - Get agent metrics

### Health Check
- `GET /api/health` - Overall health status
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `AI_AGENTS_API_URL` | AI Agents service URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | No |

## Authentication Flow

1. Frontend receives Google OAuth credential
2. Frontend sends credential to `POST /api/auth/google`
3. BFF verifies Google token and checks domain restrictions
4. BFF creates custom JWT with user permissions
5. Frontend uses JWT for subsequent API calls
6. BFF validates JWT on protected routes

## Permission System

### Roles
- **Admin**: Full access to all modules
- **Manager**: Access to operational modules
- **Viewer**: Read-only access to specific modules

### Modules
- `ai-agents`: AI Agents management
- `users`: User management
- `listings`: Vehicle listings
- `transactions`: Payment processing
- `claims`: Insurance claims
- `host-management`: Host operations
- `resolution`: Customer support
- `tech`: Technical operations

## Deployment

### Render
```bash
# Connect repository to Render
# Environment variables will be set via Render dashboard
# Service will auto-deploy on git push
```

### Docker
```bash
# Build image
docker build -t drivelah-admin-bff .

# Run container
docker run -p 3001:3001 -d drivelah-admin-bff
```

## Development

### Adding New Services
1. Create service client in `src/services/`
2. Add routes in `src/routes/`
3. Update health checks
4. Add environment variables

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- JWT token validation
- Domain-based access control
- Request/response logging

## Monitoring

Health check endpoints are available for monitoring:
- `/api/health` - Returns overall service health
- `/api/health/ready` - Kubernetes readiness probe
- `/api/health/live` - Kubernetes liveness probe

## License

Private - Drivelah Team