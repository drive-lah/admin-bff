# Render Deployment Configuration

Configuration guide for deploying admin-bff on Render.

## Service Settings

### Basic Configuration
- **Name**: `admin-bff` (or your preferred name)
- **Environment**: `Node`
- **Region**: Singapore (Southeast Asia) or closest to your users
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### Instance Type
**IMPORTANT**: This service requires at least **2GB RAM** due to:
- Large codebase (3,445+ lines of user management code)
- TypeScript compilation memory requirements
- googleapis and other large dependencies

**Recommended Plans**:
- **Starter**: 2GB RAM, 0.5 CPU ($7/month) - ✅ Recommended minimum
- **Standard**: 4GB RAM, 1 CPU ($25/month) - ✅ Better for production
- **Pro**: 8GB RAM, 2 CPU ($85/month) - For high traffic

**Free tier (512MB) will NOT work** - builds will fail with out-of-memory errors.

---

## Environment Variables

### Required Variables

```bash
# Database (PostgreSQL)
DB_HOST=your-postgres-host.render.com
DB_PORT=5432
DB_NAME=drivelah_admin
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# Google Workspace Integration
GOOGLE_ADMIN_EMAIL=admin@drivelah.sg
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/etc/secrets/drivelah-service-account.json

# Allowed Email Domains
ALLOWED_DOMAINS=drivelah.sg,drivemate.au,drivemate.nz

# Backend API (Monitor API)
BACKEND_API_URL=https://your-monitor-api.onrender.com

# Server Configuration
PORT=3001
NODE_ENV=production
```

### Secret Files

Google Service Account credentials must be uploaded as a **Secret File**:

1. Go to your service on Render
2. Click **Environment** tab
3. Scroll to **Secret Files** section
4. Click **Add Secret File**
5. Set:
   - **Filename**: `/etc/secrets/drivelah-service-account.json`
   - **Contents**: Paste your entire Google service account JSON key
6. Click **Save Changes**
7. **Redeploy** the service

---

## Build Configuration

### Memory Optimization

The build is optimized to use less memory:
- ✅ Disabled TypeScript declaration files
- ✅ Disabled source maps for production
- ✅ Incremental compilation enabled
- ✅ Scripts folder excluded from compilation
- ✅ Max heap size set to 4GB for build process

### Build Process

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript with 4GB heap
```

**Note**: The `postinstall` script has been removed to prevent out-of-memory errors during `npm install`.

---

## Health Checks

Configure health checks in Render:

- **Health Check Path**: `/api/health` or `/health`
- **Health Check Interval**: 30 seconds
- **Failure Threshold**: 3 attempts
- **Success Threshold**: 2 attempts

---

## Auto-Deploy

**Recommended**: Enable auto-deploy from `main` branch

1. Go to service settings
2. Find **Auto-Deploy** section
3. Enable "Auto-Deploy: Yes"
4. Branch: `main`

Every push to `main` will trigger automatic deployment.

---

## Troubleshooting

### Build Fails with Out of Memory

**Symptoms**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions**:
1. ✅ **Upgrade to Starter plan or higher** (minimum 2GB RAM)
2. ✅ Ensure build command is: `npm run build` (uses --max-old-space-size=4096)
3. ✅ Verify no postinstall script is running during npm install
4. Set NODE_OPTIONS environment variable: `NODE_OPTIONS=--max-old-space-size=4096`

### TypeScript Compilation Errors

**Solution**: All TypeScript errors should be fixed in the codebase. If you see new errors:
1. Run locally: `npm run type-check`
2. Fix errors locally
3. Commit and push fixes

### Service Won't Start

**Check**:
1. Verify all required environment variables are set
2. Check that secret file for Google credentials is uploaded
3. Verify database connection (DB_HOST, DB_PASSWORD, etc.)
4. Check logs for specific error messages

### Google Workspace Sync Fails

**Check**:
1. Secret file path matches: `/etc/secrets/drivelah-service-account.json`
2. GOOGLE_ADMIN_EMAIL has admin privileges
3. Service account has domain-wide delegation enabled
4. Required API scopes are granted

---

## Monitoring

### Logs

Access logs in Render:
- Service dashboard → **Logs** tab
- Filter by log level (info, warn, error)
- Search for specific errors or events

### Metrics

Monitor service health:
- **CPU Usage**: Should stay below 80%
- **Memory Usage**: Should stay below 80% of allocated RAM
- **Response Time**: Monitor via Render metrics dashboard

### Alerts

Set up email notifications:
1. Go to service **Settings**
2. Scroll to **Notifications**
3. Add team email addresses
4. Enable alerts for:
   - Deploy failures
   - Service crashes
   - High memory usage

---

## Scaling

### Horizontal Scaling

To handle more traffic:
1. Increase number of instances in Render dashboard
2. Render will load balance automatically
3. Ensure database can handle multiple connections

### Vertical Scaling

To handle more memory/CPU intensive operations:
1. Upgrade to Standard or Pro plan
2. Monitor memory usage after upgrade
3. Adjust NODE_OPTIONS if needed

---

## Cost Optimization

- **Starter Plan**: $7/month - Good for development/staging
- **Standard Plan**: $25/month - Recommended for production
- **Database**: Add ~$7-25/month for PostgreSQL

**Total estimated cost**: $14-50/month depending on plan

---

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] Google service account credentials uploaded as secret file
- [ ] JWT_SECRET is strong (minimum 32 characters)
- [ ] Database password is secure
- [ ] ALLOWED_DOMAINS is correctly configured
- [ ] HTTPS is enabled (Render provides this automatically)
- [ ] Health checks are configured
- [ ] Monitoring and alerts are enabled

---

**Last Updated**: 2025-10-18
**Minimum Render Plan**: Starter (2GB RAM)
