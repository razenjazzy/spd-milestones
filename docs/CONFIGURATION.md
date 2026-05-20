# SPD Milestones - Configuration Reference

## Overview

This document provides a comprehensive reference for all configuration options in SPD Milestones v1.0.0-beta.1. All settings are controlled through environment variables, allowing flexible deployment across different environments without code changes.

---

## Table of Contents

1. [Environment Variables Overview](#environment-variables-overview)
2. [Server Configuration](#server-configuration)
3. [Database Configuration](#database-configuration)
4. [CORS Configuration](#cors-configuration)
5. [Logging Configuration](#logging-configuration)
6. [Monitoring Configuration](#monitoring-configuration)
7. [Frontend Configuration](#frontend-configuration)
8. [Configuration Examples](#configuration-examples)
9. [Environment-Specific Configurations](#environment-specific-configurations)
10. [Validation & Troubleshooting](#validation--troubleshooting)
11. [Security Best Practices](#security-best-practices)
12. [Performance Tuning](#performance-tuning)
13. [Migration Guide](#migration-guide)

---

## Environment Variables Overview

SPD Milestones uses environment variables for all runtime configuration. This approach provides:

✅ **Flexibility** - Deploy to different environments without code changes  
✅ **Security** - Keep secrets out of source code  
✅ **Portability** - Easy migration between environments  
✅ **Scalability** - Configure resources based on load  

### Backend Environment Variables (10 variables)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `PORT` | Number | 4000 | No | Backend API server port |
| `NODE_ENV` | String | development | No | Application environment mode |
| `MONGO_URI` | String | - | **Yes** | MongoDB connection string |
| `FRONTEND_URL` | String | localhost:5173 | No | Frontend URL for CORS |
| `LOG_TO_FILE` | Boolean | false | No | Enable file-based logging |
| `LOG_RETENTION_DAYS` | Number | 30 | No | Log file retention period |
| `LOG_LEVEL` | String | debug/info | No | Minimum log level |
| `MONITORING_INTERVAL_MINUTES` | Number | 60 | No | Health check frequency |

### Frontend Environment Variables (1 variable)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `VITE_API_BASE` | String | localhost:4000/api | No | Backend API base URL |

### AI Environment Variables (Backend)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `GEMINI_API_KEY` | String | - | For Gemini mode | API key used for Gemini prompt parsing |
| `GEMINI_MODEL` | String | gemini-2.0-flash | No | Default Gemini model name |
| `GEMINI_API_BASE` | String | https://generativelanguage.googleapis.com/v1beta | No | Gemini API base URL |
| `GEMINI_FALLBACK_TO_LOCAL` | Boolean | true | No | If Gemini/Gemini CLI fails, fallback to local parser |
| `GEMINI_CLI_COMMAND` | String | (auto) | No | Optional command used to run Gemini CLI bridge |
| `GEMINI_CLI_CODEBASE_PATH` | String | backend cwd | No | Repo path Gemini CLI should analyze |
| `GEMINI_CLI_TIMEOUT_MS` | Number | 45000 | No | Timeout for Gemini CLI bridge request |

---

## Server Configuration

### PORT

**Description:** The port number on which the backend API server listens for incoming HTTP connections.

**Type:** Number  
**Default:** `4000`  
**Range:** 1024-65535 (unprivileged ports)  
**Required:** No  
**Environment Impact:** All  

**Usage:**
```env
PORT=4000
```

**Examples:**
```env
# Development
PORT=4000

# Production (standard)
PORT=4000

# Production (alternative)
PORT=8080

# Behind reverse proxy
PORT=3001
```

**Considerations:**
- Ports below 1024 require root privileges (avoid in production)
- Ensure the port is not already in use
- Update firewall rules if necessary
- Docker: Map host port to container port in docker-compose.yml
- Load balancers typically use standard ports (80/443) externally

**Common Issues:**
```
Error: Port 4000 is already in use
Solution: Change PORT or kill the process using that port
Command: netstat -ano | findstr "4000"  (Windows)
         lsof -i :4000  (Linux/Mac)
```

**Related Configuration:**
- Frontend must know this port for API calls
- Health check endpoints use this port
- Docker Compose port mapping

---

### NODE_ENV

**Description:** Defines the application's runtime environment, affecting logging verbosity, error handling, performance optimizations, and debugging features.

**Type:** String (Enum)  
**Default:** `development`  
**Options:** `development` | `production` | `staging` | `test`  
**Required:** No  
**Environment Impact:** All features  

**Usage:**
```env
NODE_ENV=production
```

**Options Explained:**

#### development
```env
NODE_ENV=development
```
**Characteristics:**
- Verbose logging (DEBUG level)
- Detailed error messages with stack traces
- Hot module reloading
- Source maps enabled
- Performance monitoring disabled
- CORS permissive

**Use Cases:**
- Local development
- Debugging issues
- Testing new features

#### production
```env
NODE_ENV=production
```
**Characteristics:**
- Minimal logging (INFO level)
- Generic error messages (no stack traces to clients)
- Optimized builds
- Performance optimizations enabled
- CORS strict
- Caching enabled

**Use Cases:**
- Production deployments
- Customer-facing environments
- Performance-critical systems

#### staging
```env
NODE_ENV=staging
```
**Characteristics:**
- Moderate logging (INFO level)
- Detailed errors (for debugging)
- Production-like configuration
- Additional monitoring
- Testing environment

**Use Cases:**
- Pre-production testing
- QA environments
- Integration testing

#### test
```env
NODE_ENV=test
```
**Characteristics:**
- Isolated database
- Minimal logging (WARN level)
- Fast execution
- Mock external services

**Use Cases:**
- Automated testing
- CI/CD pipelines
- Unit/integration tests

**Impact on Features:**

| Feature | development | production | staging | test |
|---------|-------------|------------|---------|------|
| Log Level | DEBUG | INFO | INFO | WARN |
| Error Details | Full stack | Generic | Full stack | Minimal |
| Performance | Standard | Optimized | Optimized | Fast |
| Source Maps | Yes | No | Yes | No |
| Hot Reload | Yes | No | No | No |

**Related Configuration:**
- LOG_LEVEL (should match NODE_ENV)
- MONGO_URI (may differ per environment)
- FRONTEND_URL (differs per environment)

---

## Database Configuration

### MONGO_URI

**Description:** MongoDB connection string that specifies how the application connects to the database, including host, port, database name, authentication credentials, and connection options.

**Type:** String (Connection URI)  
**Default:** None  
**Required:** **Yes** (Application will not start without it)  
**Environment Impact:** All  

**Usage:**
```env
MONGO_URI=mongodb://mongo:27017/spd
```

**Connection String Format:**
```
mongodb://[username:password@]host[:port]/database[?options]
```

**Examples by Environment:**

#### Local Development (MongoDB installed locally)
```env
MONGO_URI=mongodb://localhost:27017/spd
```
**Characteristics:**
- No authentication required
- Runs on default port 27017
- Database name: `spd`
- Fast connection (localhost)

#### Docker Deployment (MongoDB in container)
```env
MONGO_URI=mongodb://mongo:27017/spd
```
**Characteristics:**
- Uses Docker service name `mongo`
- Container-to-container communication
- No exposed external ports needed
- Isolated network

#### Production with Authentication
```env
MONGO_URI=mongodb://admin:SecurePassword123@localhost:27017/spd?authSource=admin
```
**Characteristics:**
- Username: `admin`
- Password: `SecurePassword123`
- Authentication database: `admin`
- Secure credentials required

#### MongoDB Atlas (Cloud)
```env
MONGO_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/spd?retryWrites=true&w=majority
```
**Characteristics:**
- Managed cloud database
- Automatic failover
- Global distribution
- SSL/TLS encryption
- Connection pooling

#### MongoDB Replica Set (High Availability)
```env
MONGO_URI=mongodb://user:pass@host1:27017,host2:27017,host3:27017/spd?replicaSet=rs0
```
**Characteristics:**
- Multiple database servers
- Automatic failover
- Read/write splitting
- High availability

**Connection Options:**

Common query parameters:
- `authSource=admin` - Authentication database
- `retryWrites=true` - Automatically retry failed writes
- `w=majority` - Write concern (wait for majority acknowledgment)
- `ssl=true` - Use SSL/TLS encryption
- `maxPoolSize=10` - Maximum connection pool size
- `minPoolSize=2` - Minimum connection pool size
- `serverSelectionTimeoutMS=5000` - Timeout for server selection
- `socketTimeoutMS=45000` - Socket timeout

**Security Considerations:**

⚠️ **CRITICAL: Never commit credentials to version control**

```env
# ❌ BAD - Credentials in code
MONGO_URI=mongodb://admin:password123@localhost:27017/spd

# ✅ GOOD - Use environment variables
# Store in .env file (excluded from Git)
MONGO_URI=mongodb://admin:${DB_PASSWORD}@localhost:27017/spd
```

**Password Requirements:**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- Rotate every 90 days

**Special Characters in Password:**

If password contains special characters, URL-encode them:
```
@ = %40
: = %3A
/ = %2F
? = %3F
# = %23
[ = %5B
] = %5D
```

Example:
```env
# Password: P@ssw0rd!
MONGO_URI=mongodb://admin:P%40ssw0rd!@localhost:27017/spd
```

**Troubleshooting:**

**Error: Connection refused**
```
Solution: Ensure MongoDB is running
Check: docker-compose ps mongo  (Docker)
       systemctl status mongodb  (Linux)
       net start MongoDB  (Windows)
```

**Error: Authentication failed**
```
Solution: Verify username and password
Check: Use correct authSource parameter
       Ensure user has proper permissions
```

**Error: Timeout connecting to server**
```
Solution: Check network connectivity
         Verify firewall rules
         Increase serverSelectionTimeoutMS
```

**Performance Tuning:**

For high-load applications:
```env
MONGO_URI=mongodb://localhost:27017/spd?maxPoolSize=50&minPoolSize=10
```

For read-heavy workloads:
```env
MONGO_URI=mongodb://localhost:27017/spd?readPreference=secondaryPreferred
```

**Related Configuration:**
- Application cannot start without valid MONGO_URI
- Health check tests database connectivity
- Monitoring system depends on database access

---

## CORS Configuration

### FRONTEND_URL

**Description:** Specifies the allowed origin for Cross-Origin Resource Sharing (CORS), determining which frontend URLs can make API requests to the backend. This is a critical security setting.

**Type:** String (URL)  
**Default:** `http://localhost:5173` (Vite dev server)  
**Required:** No (defaults to Vite port)  
**Environment Impact:** All  

**Usage:**
```env
FRONTEND_URL=http://localhost:3000
```

**Format:**
```
protocol://hostname:port
```

**Examples by Environment:**

#### Local Development (Vite dev server)
```env
FRONTEND_URL=http://localhost:5173
```
**Use Case:** Running frontend with `npm run dev`

#### Docker Development
```env
FRONTEND_URL=http://localhost:3000
```
**Use Case:** Frontend running in Docker container

#### Production (Single Domain)
```env
FRONTEND_URL=https://spd-milestones.example.com
```
**Use Case:** Production deployment with HTTPS

#### Production (Multiple Subdomains)
```env
# Note: Currently supports single origin
# For multiple origins, code modification required
FRONTEND_URL=https://app.example.com
```

#### Staging Environment
```env
FRONTEND_URL=https://staging.spd-milestones.example.com
```
**Use Case:** Pre-production testing

**CORS Behavior:**

The backend will:
✅ Allow requests from `FRONTEND_URL`  
✅ Include `Access-Control-Allow-Origin` header  
✅ Allow credentials (cookies, auth headers)  
❌ Block requests from other origins  

**Security Implications:**

**✅ Correct Configuration:**
```env
# Specific domain (recommended)
FRONTEND_URL=https://app.example.com

# Development (acceptable)
FRONTEND_URL=http://localhost:5173
```

**❌ Insecure Configuration:**
```env
# ⚠️ NEVER use wildcard in production
FRONTEND_URL=*

# ⚠️ NEVER allow all subdomains without validation
FRONTEND_URL=*.example.com
```

**Common CORS Issues:**

**Error: CORS policy blocked**
```
Browser Console: 
"Access to XMLHttpRequest at 'http://localhost:4000/api/projects' 
from origin 'http://localhost:3000' has been blocked by CORS policy"

Solution: Update FRONTEND_URL to match frontend origin
Verify: FRONTEND_URL=http://localhost:3000
```

**Error: No 'Access-Control-Allow-Origin' header**
```
Solution: Ensure backend is configured with FRONTEND_URL
Check: Backend .env file exists and is loaded
       CORS middleware is registered in app.ts
```

**Multiple Frontend URLs:**

If you need to support multiple frontend URLs (development + production):

**Option 1: Environment-specific .env files**
```bash
.env.development:  FRONTEND_URL=http://localhost:5173
.env.production:   FRONTEND_URL=https://app.example.com
```

**Option 2: Code modification (not currently implemented)**
```typescript
// Future enhancement: Support multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://app.example.com'
];
```

**Testing CORS Configuration:**

```bash
# Test from browser console
fetch('http://localhost:4000/api/projects')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

# Test with curl
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:4000/api/projects -v
```

**Protocol Considerations:**

**Development:**
```env
FRONTEND_URL=http://localhost:5173  # HTTP is acceptable
```

**Production:**
```env
FRONTEND_URL=https://app.example.com  # HTTPS required
```

⚠️ **Warning:** Mixing HTTP backend with HTTPS frontend will cause CORS issues and security warnings.

**Port Considerations:**

- Include port number if non-standard (not 80 for HTTP, not 443 for HTTPS)
- Omit standard ports for cleaner configuration

```env
# Development - include port
FRONTEND_URL=http://localhost:3000

# Production standard HTTPS - omit port
FRONTEND_URL=https://app.example.com

# Production non-standard - include port
FRONTEND_URL=https://app.example.com:8443
```

**Related Configuration:**
- Frontend must be configured to call backend at correct URL
- Health checks are not affected by CORS
- Monitoring endpoints follow same CORS rules

---

## Logging Configuration

### LOG_TO_FILE

**Description:** Enables or disables file-based logging. When enabled, logs are written to daily files in the `logs/` directory in addition to console output.

**Type:** Boolean  
**Default:** `false`  
**Options:** `true` | `false`  
**Required:** No  
**Environment Impact:** Logging system  

**Usage:**
```env
LOG_TO_FILE=true
```

**Behavior:**

#### When `LOG_TO_FILE=false` (Default)
```env
LOG_TO_FILE=false
```
**Characteristics:**
- Logs only output to console
- No disk I/O overhead
- No log files created
- Suitable for development
- Container logs capture output

**Output:**
```
Console: [2025-11-03T10:30:00.000Z] INFO: Server started on port 4000
Files: (none)
```

#### When `LOG_TO_FILE=true`
```env
LOG_TO_FILE=true
```
**Characteristics:**
- Logs written to console AND files
- Daily log rotation (automatic at midnight)
- Archived logs moved to `logs/archive/`
- Suitable for production
- Audit trail maintained

**Output:**
```
Console: [2025-11-03T10:30:00.000Z] INFO: Server started on port 4000
File: logs/app-2025-11-03.log (JSON format)
```

**File Structure:**

When enabled, logs are organized as:
```
logs/
├── app-2025-11-03.log      # Current day's log
└── archive/
    ├── app-2025-11-02.log  # Yesterday
    ├── app-2025-11-01.log  # 2 days ago
    └── app-2025-10-04.log  # 30 days ago (will be deleted)
```

**Log File Format:**

Console output (human-readable):
```
[2025-11-03T10:30:00.000Z] INFO: Server started on port 4000
[2025-11-03T10:30:05.000Z] HTTP: GET /api/projects - 200 (125ms)
[2025-11-03T10:30:10.000Z] ERROR: Failed to connect to database
```

File output (JSON format):
```json
{"timestamp":"2025-11-03T10:30:00.000Z","level":"INFO","message":"Server started on port 4000","context":{"port":4000}}
{"timestamp":"2025-11-03T10:30:05.000Z","level":"HTTP","message":"GET /api/projects - 200 (125ms)","context":{"method":"GET","path":"/api/projects","status":200,"duration":125}}
{"timestamp":"2025-11-03T10:30:10.000Z","level":"ERROR","message":"Failed to connect to database","context":{"error":"MongoNetworkError"}}
```

**Benefits of File Logging:**

✅ **Audit Trail** - Permanent record of all activities  
✅ **Debugging** - Review logs after issues occur  
✅ **Compliance** - Meet regulatory logging requirements  
✅ **Analysis** - Parse logs for trends and patterns  
✅ **Alerting** - Monitor log files for critical events  

**Disk Space Considerations:**

Approximate log file sizes (per day):

| LOG_LEVEL | Typical Size | High-Load Size |
|-----------|--------------|----------------|
| debug | 500MB - 2GB | 5GB+ |
| info | 100MB - 500MB | 1GB+ |
| warn | 10MB - 100MB | 200MB+ |
| error | 1MB - 10MB | 50MB+ |

**Recommendations:**
- Enable in production for audit trails
- Disable in development if disk space limited
- Monitor disk usage regularly
- Use log rotation and retention policies

**Docker Considerations:**

In Docker deployments, ensure logs directory is mounted as a volume:

```yaml
# docker-compose.yml
backend:
  volumes:
    - ./logs:/app/logs  # Persist logs on host
```

Without volume mount, logs will be lost when container restarts.

**Performance Impact:**

- **Minimal** when LOG_LEVEL=info or warn
- **Moderate** when LOG_LEVEL=debug (high I/O)
- **Asynchronous writes** - non-blocking
- **Buffered I/O** - efficient disk usage

**Related Configuration:**
- `LOG_RETENTION_DAYS` - How long to keep logs
- `LOG_LEVEL` - What to log
- Docker volume mount for persistence

---

### LOG_RETENTION_DAYS

**Description:** Number of days to retain archived log files before automatic deletion. Helps manage disk space while maintaining audit trail.

**Type:** Number  
**Default:** `30`  
**Range:** 1-365 days  
**Required:** No  
**Environment Impact:** Log file management  

**Usage:**
```env
LOG_RETENTION_DAYS=30
```

**How It Works:**

1. **Daily Rotation:** At midnight, current log moves to archive
2. **Archive Storage:** Old logs stored in `logs/archive/`
3. **Automatic Cleanup:** Logs older than retention period are deleted
4. **Runs Daily:** Cleanup occurs during log rotation

**Example Timeline (RETENTION=30):**

```
Day 1:  Create logs/app-2025-11-03.log
Day 2:  Move to logs/archive/app-2025-11-03.log
        Create logs/app-2025-11-04.log
...
Day 30: Archive contains 29 files (2-30 days old)
Day 31: Delete logs/archive/app-2025-11-03.log (31 days old)
        Archive contains 29 files (2-31 days old)
```

**Common Retention Periods:**

#### 7 Days (1 Week)
```env
LOG_RETENTION_DAYS=7
```
**Use Cases:**
- Development environments
- Limited disk space
- Non-critical logging
- High log volume

**Disk Space:** ~5-20GB (depending on LOG_LEVEL)

#### 30 Days (1 Month) - **Recommended**
```env
LOG_RETENTION_DAYS=30
```
**Use Cases:**
- Production environments
- Standard audit requirements
- Balanced space/retention
- Most applications

**Disk Space:** ~15-60GB (depending on LOG_LEVEL)

#### 90 Days (1 Quarter)
```env
LOG_RETENTION_DAYS=90
```
**Use Cases:**
- Compliance requirements
- Financial applications
- Detailed audit trails
- Security monitoring

**Disk Space:** ~45-180GB (depending on LOG_LEVEL)

#### 365 Days (1 Year)
```env
LOG_RETENTION_DAYS=365
```
**Use Cases:**
- Strict compliance (GDPR, HIPAA, SOX)
- Legal requirements
- Long-term analysis
- Critical systems

**Disk Space:** ~180-730GB (depending on LOG_LEVEL)

**Compliance Guidelines:**

| Industry | Typical Requirement | Recommended Setting |
|----------|---------------------|---------------------|
| General Business | 30-90 days | 90 |
| Financial (SOX) | 7 years | 365+ with external archive |
| Healthcare (HIPAA) | 6 years | 365+ with external archive |
| Payment (PCI-DSS) | 1 year | 365 |
| EU (GDPR) | Variable | 90-365 |

**Disk Space Calculation:**

```
Estimated Space = Daily Log Size × LOG_RETENTION_DAYS

Example (LOG_LEVEL=info):
  Daily Size: 250MB
  Retention: 30 days
  Total: 250MB × 30 = 7.5GB
```

**Monitoring Disk Usage:**

```powershell
# Windows
Get-ChildItem logs\archive -Recurse | Measure-Object -Property Length -Sum

# Result example:
# Count: 30
# Sum: 7500000000 (7.5GB)
```

```bash
# Linux/Mac
du -sh logs/archive
# Result: 7.5G logs/archive
```

**Automatic Cleanup Process:**

The log file manager automatically:
1. Checks retention policy daily during rotation
2. Identifies files older than retention period
3. Deletes expired files from archive
4. Logs cleanup actions

**Cleanup Example:**
```
[2025-11-03T00:00:01.000Z] INFO: Log file rotated: app-2025-11-02.log moved to archive
[2025-11-03T00:00:02.000Z] INFO: Cleaning old archives older than 30 days
[2025-11-03T00:00:02.000Z] INFO: Deleted expired log: archive/app-2025-10-03.log
```

**Manual Archive Management:**

If you need longer retention, manually archive before deletion:

```powershell
# Compress old logs before they're deleted
Compress-Archive -Path logs\archive\app-2025-10-*.log -DestinationPath archive-october.zip

# Upload to cloud storage
aws s3 cp archive-october.zip s3://my-bucket/logs/
```

**Best Practices:**

1. **Start Conservative:** Begin with 30 days, adjust based on needs
2. **Monitor Disk Space:** Set up alerts at 80% capacity
3. **Compliance First:** Check legal requirements before setting
4. **External Backup:** Archive critical logs to external storage
5. **Document Policy:** Record retention decisions for audit

**Related Configuration:**
- `LOG_TO_FILE` - Must be true for retention to apply
- `LOG_LEVEL` - Affects log file size
- Disk space and volume mounts

---

### LOG_LEVEL

**Description:** Minimum severity level for log messages. Messages below this level are filtered out. Controls log verbosity and file size.

**Type:** String (Enum)  
**Default:** `debug` (development), `info` (production)  
**Options:** `debug` | `info` | `warn` | `error`  
**Required:** No  
**Environment Impact:** All logging output  

**Usage:**
```env
LOG_LEVEL=info
```

**Log Level Hierarchy:**

```
DEBUG (0)  ←  Most verbose
  ↓
INFO (1)
  ↓
WARN (2)
  ↓
ERROR (3)  ←  Least verbose
```

**Rule:** Setting a level includes that level and all levels below it.

**Log Levels Explained:**

#### debug (Level 0) - Development
```env
LOG_LEVEL=debug
```

**Includes:** DEBUG + INFO + WARN + ERROR

**What Gets Logged:**
- Database queries and results
- Function entry/exit points
- Variable values
- API request/response payloads
- Detailed execution flow
- Cache hits/misses
- Performance measurements
- All informational messages
- All warnings
- All errors

**Example Output:**
```
[DEBUG] Entering projectService.createProject with data: {"name":"Project Alpha"}
[DEBUG] Validating project data...
[DEBUG] Executing MongoDB query: db.projects.insertOne(...)
[DEBUG] Query result: {"_id":"507f...", "name":"Project Alpha"}
[DEBUG] Exiting projectService.createProject, duration: 45ms
[INFO] Project created successfully: Project Alpha
```

**Use Cases:**
- Local development
- Debugging specific issues
- Understanding code flow
- Performance analysis
- **NOT for production** (too verbose)

**File Size:** 500MB - 2GB per day  
**Performance Impact:** High (many write operations)

---

#### info (Level 1) - Production (Recommended)
```env
LOG_LEVEL=info
```

**Includes:** INFO + WARN + ERROR  
**Excludes:** DEBUG

**What Gets Logged:**
- Application startup/shutdown
- Configuration loaded
- Successful operations
- HTTP requests/responses
- Database connections
- Monitoring checks
- Test results
- Warnings
- Errors

**Example Output:**
```
[INFO] SPD Milestones Backend starting on port 4000
[INFO] MongoDB connected successfully
[INFO] Monitoring service started with interval: 60 minutes
[HTTP] GET /api/projects - 200 (125ms)
[INFO] Project created: Project Alpha
[WARN] Slow query detected: 2500ms
[ERROR] Failed to send email notification
```

**Use Cases:**
- **Production environments** (recommended)
- Staging environments
- Standard operational logging
- Audit trails
- Performance monitoring

**File Size:** 100MB - 500MB per day  
**Performance Impact:** Moderate (balanced)

---

#### warn (Level 2) - High-Load Production
```env
LOG_LEVEL=warn
```

**Includes:** WARN + ERROR  
**Excludes:** DEBUG, INFO

**What Gets Logged:**
- Deprecated feature usage
- Performance degradation
- Recoverable errors
- Configuration issues
- Resource constraints
- Security warnings
- All errors

**Example Output:**
```
[WARN] Database connection pool exhausted, waiting for available connection
[WARN] API endpoint /api/old-projects is deprecated, use /api/projects instead
[WARN] High memory usage detected: 85%
[ERROR] Database connection failed, retrying...
[ERROR] Authentication failed for user: admin
```

**Use Cases:**
- High-load production systems
- Performance-critical applications
- Limited disk space
- Minimal logging requirements
- Security monitoring

**File Size:** 10MB - 100MB per day  
**Performance Impact:** Low

---

#### error (Level 3) - Minimal Logging
```env
LOG_LEVEL=error
```

**Includes:** ERROR only  
**Excludes:** DEBUG, INFO, WARN

**What Gets Logged:**
- Application errors
- Database errors
- API errors
- Unhandled exceptions
- Critical failures
- Stack traces

**Example Output:**
```
[ERROR] MongoDB connection failed: MongoNetworkError: connection refused
[ERROR] Unhandled exception in projectController.createProject
  Error: Project name is required
    at validateProject (projectService.ts:45)
    at createProject (projectController.ts:23)
[ERROR] Health check failed: timeout after 5000ms
```

**Use Cases:**
- Error-only monitoring
- Alerting systems
- Minimal disk usage
- Compliance (error tracking only)
- **Rarely recommended** (loses important context)

**File Size:** 1MB - 10MB per day  
**Performance Impact:** Very low

---

**Impact Comparison Table:**

| Aspect | debug | info | warn | error |
|--------|-------|------|------|-------|
| **Messages/Hour** | 10,000+ | 1,000+ | 100+ | 10+ |
| **File Size/Day** | 500MB-2GB | 100-500MB | 10-100MB | 1-10MB |
| **Disk I/O** | High | Medium | Low | Very Low |
| **CPU Impact** | 5-10% | 1-3% | <1% | <0.5% |
| **Debugging Ability** | Excellent | Good | Limited | Poor |
| **Production Use** | ❌ No | ✅ Yes | ✅ Yes | ⚠️ Limited |

**Choosing the Right Level:**

**For Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
```
Reason: Maximum visibility for debugging

**For Staging:**
```env
NODE_ENV=staging
LOG_LEVEL=info
```
Reason: Production-like logging with full audit trail

**For Production (Standard):**
```env
NODE_ENV=production
LOG_LEVEL=info
```
Reason: Balanced logging for operations and debugging

**For Production (High-Load):**
```env
NODE_ENV=production
LOG_LEVEL=warn
```
Reason: Minimal overhead, focus on issues

**Dynamic Log Level:**

Currently not supported, but you can restart the application with different LOG_LEVEL values:

```powershell
# Temporarily increase log level for debugging
$env:LOG_LEVEL="debug"
docker-compose restart backend

# Reset to normal
$env:LOG_LEVEL="info"
docker-compose restart backend
```

**Related Configuration:**
- `NODE_ENV` - Should match LOG_LEVEL philosophy
- `LOG_TO_FILE` - Log level affects file size
- `LOG_RETENTION_DAYS` - Lower levels = longer retention possible

---

## Monitoring Configuration

### MONITORING_INTERVAL_MINUTES

**Description:** Frequency (in minutes) at which the automated health monitoring system checks all projects for critical issues, overdue milestones, and completion status.

**Type:** Number  
**Default:** `60`  
**Range:** 1-1440 minutes (1 minute to 24 hours)  
**Required:** No  
**Environment Impact:** Monitoring system performance  

**Usage:**
```env
MONITORING_INTERVAL_MINUTES=60
```

**How It Works:**

1. **Application Startup:** Monitoring system starts automatically
2. **First Check:** Runs immediately on startup
3. **Periodic Checks:** Runs every N minutes thereafter
4. **Health Analysis:** Each check analyzes all projects
5. **Automatic Logging:** Critical issues logged automatically

**Monitoring Process:**

```
Application Start
       ↓
Immediate Health Check (analyze all projects)
       ↓
Wait MONITORING_INTERVAL_MINUTES
       ↓
Scheduled Health Check (analyze all projects)
       ↓
Detect Critical Projects (overdue, low completion)
       ↓
Log Critical Issues (automatic alerting)
       ↓
Wait MONITORING_INTERVAL_MINUTES
       ↓
(repeat)
```

**Common Interval Values:**

#### 5 Minutes - Development/Testing
```env
MONITORING_INTERVAL_MINUTES=5
```

**Characteristics:**
- Very fast feedback
- High database load
- 288 health checks per day
- Immediate issue detection

**Use Cases:**
- Active development
- Testing monitoring features
- Debugging project issues
- Real-time dashboards

**Database Load:** High  
**Resource Usage:** ~5% CPU  
**Recommended For:** Development only

---

#### 15 Minutes - Active Projects
```env
MONITORING_INTERVAL_MINUTES=15
```

**Characteristics:**
- Quick feedback
- Moderate database load
- 96 health checks per day
- Near real-time monitoring

**Use Cases:**
- Projects with frequent updates
- Active sprint tracking
- High-priority monitoring
- Customer-facing dashboards

**Database Load:** Moderate  
**Resource Usage:** ~2% CPU  
**Recommended For:** Active project environments

---

#### 60 Minutes (1 Hour) - Production Standard ⭐
```env
MONITORING_INTERVAL_MINUTES=60
```

**Characteristics:**
- Balanced monitoring
- Low database load
- 24 health checks per day
- Standard production monitoring

**Use Cases:**
- **Standard production deployments** (recommended)
- Normal project tracking
- Balanced resource usage
- Most applications

**Database Load:** Low  
**Resource Usage:** ~0.5% CPU  
**Recommended For:** Most production environments

---

#### 120 Minutes (2 Hours) - Low-Priority
```env
MONITORING_INTERVAL_MINUTES=120
```

**Characteristics:**
- Infrequent checks
- Minimal database load
- 12 health checks per day
- Reduced overhead

**Use Cases:**
- Low-priority projects
- Archived projects
- Resource-constrained systems
- Overnight monitoring

**Database Load:** Very Low  
**Resource Usage:** ~0.2% CPU  
**Recommended For:** Low-activity systems

---

#### 360 Minutes (6 Hours) - Minimal
```env
MONITORING_INTERVAL_MINUTES=360
```

**Characteristics:**
- Rare checks
- Negligible database load
- 4 health checks per day
- Maximum efficiency

**Use Cases:**
- Long-term projects
- Quarterly reviews
- Maintenance mode
- Cost optimization

**Database Load:** Negligible  
**Resource Usage:** <0.1% CPU  
**Recommended For:** Minimal monitoring needs

---

#### 1440 Minutes (24 Hours/Daily) - Archive Mode
```env
MONITORING_INTERVAL_MINUTES=1440
```

**Characteristics:**
- Daily checks only
- Almost no database load
- 1 health check per day
- Absolute minimum

**Use Cases:**
- Archived projects
- Historical data
- Compliance checking
- Inactive systems

**Database Load:** None (practically)  
**Resource Usage:** <0.01% CPU  
**Recommended For:** Archive/read-only systems

---

**Performance Impact Comparison:**

| Interval | Checks/Day | DB Queries/Day | CPU Usage | Recommended For |
|----------|------------|----------------|-----------|-----------------|
| 5 min | 288 | ~3,000 | 5% | Development |
| 15 min | 96 | ~1,000 | 2% | Active projects |
| **60 min** | **24** | **~250** | **0.5%** | **Production** ⭐ |
| 120 min | 12 | ~125 | 0.2% | Low-priority |
| 360 min | 4 | ~40 | <0.1% | Minimal |
| 1440 min | 1 | ~10 | <0.01% | Archive |

**What Each Check Does:**

1. **Fetch All Projects** from database
2. **For Each Project:**
   - Get all milestones
   - Calculate completion rate
   - Check for overdue dates
   - Classify health status (healthy/warning/critical)
3. **Identify Critical Projects**
4. **Log Critical Issues** (automatic alerting)
5. **Generate Health Report** (available via API)

**Calculation:**
```
Database Queries per Check = 1 + (Number of Projects × 1)

Example with 10 projects:
  1 query for all projects
  + 10 queries for milestones (1 per project)
  = 11 queries per check

With 60-minute interval:
  24 checks/day × 11 queries = 264 queries/day
```

**Automatic Alerting:**

When critical projects are detected, they are automatically logged:

```
[2025-11-03T10:00:00.000Z] ERROR: CRITICAL PROJECT DETECTED: Website Redesign (ID: 507f...)
  Status: critical
  Issues: Project is overdue, 3 milestones overdue
  Overdue Milestones: 3
  Completion Rate: 60%
  Total Milestones: 10
```

**API Access (On-Demand):**

Regardless of interval, you can manually trigger monitoring:

```bash
# Get current health report (any time)
curl http://localhost:4000/api/monitoring/report

# Check specific project health
curl http://localhost:4000/api/monitoring/project/507f1f77bcf86cd799439011

# Get all overdue milestones
curl http://localhost:4000/api/monitoring/overdue
```

**Disabling Monitoring:**

To disable automatic monitoring (not recommended):

```env
# Set to a very high value
MONITORING_INTERVAL_MINUTES=99999

# Or comment out
# MONITORING_INTERVAL_MINUTES=60
```

**Note:** API endpoints still work even if automatic monitoring is disabled.

**Tuning Recommendations:**

**For Small Teams (<10 projects):**
```env
MONITORING_INTERVAL_MINUTES=60  # Standard is fine
```

**For Large Teams (50+ projects):**
```env
MONITORING_INTERVAL_MINUTES=120  # Reduce load
```

**For Enterprise (100+ projects):**
```env
MONITORING_INTERVAL_MINUTES=360  # Minimize overhead
# Consider implementing manual monitoring or external tools
```

**For Development:**
```env
MONITORING_INTERVAL_MINUTES=5  # Fast feedback
```

**Related Configuration:**
- Database performance (more checks = more load)
- LOG_LEVEL (monitoring actions are logged)
- Server resources (CPU, memory, network)

---

## Frontend Configuration

### VITE_API_BASE

**Description:** Base URL for backend API endpoints. Used by the frontend to construct API request URLs. Must match the backend server location.

**Type:** String (URL)  
**Default:** `http://localhost:4000/api`  
**Required:** No (has sensible default)  
**Environment Impact:** All API calls from frontend  

**Usage:**
```env
VITE_API_BASE=http://localhost:4000/api
```

**Format:**
```
protocol://hostname:port/path
```

**Important:** Always include `/api` at the end (backend API routes are under `/api` prefix)

**Examples by Environment:**

#### Local Development (Backend on host)
```env
VITE_API_BASE=http://localhost:4000/api
```
**Scenario:** 
- Frontend: `npm run dev` (port 5173)
- Backend: Running locally (port 4000)

#### Docker Development (Both containerized)
```env
VITE_API_BASE=http://localhost:4000/api
```
**Scenario:** 
- Frontend: Docker container (port 3000)
- Backend: Docker container (port 4000)
- Host machine accesses both via localhost

#### Production (Same Domain)
```env
VITE_API_BASE=https://spd-milestones.example.com/api
```
**Scenario:** 
- Frontend: https://spd-milestones.example.com
- Backend: https://spd-milestones.example.com/api (reverse proxy)

#### Production (Separate Domains)
```env
VITE_API_BASE=https://api.spd-milestones.example.com
```
**Scenario:** 
- Frontend: https://app.spd-milestones.example.com
- Backend: https://api.spd-milestones.example.com

#### Production (Subdomain API)
```env
VITE_API_BASE=https://api.example.com/spd/v1
```
**Scenario:** 
- Frontend: https://spd.example.com
- Backend: https://api.example.com/spd/v1

**How It's Used:**

The frontend API client constructs URLs:

```typescript
// api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'
});

// Usage in components
api.get('/projects')  // → GET http://localhost:4000/api/projects
api.post('/projects', data)  // → POST http://localhost:4000/api/projects
api.get('/milestones/project/123')  // → GET http://localhost:4000/api/milestones/project/123
```

**Common Mistakes:**

❌ **Missing `/api` suffix:**
```env
VITE_API_BASE=http://localhost:4000  # Wrong!
# Results in: http://localhost:4000/projects (404 Not Found)
```

✅ **Correct with `/api`:**
```env
VITE_API_BASE=http://localhost:4000/api  # Correct!
# Results in: http://localhost:4000/api/projects (200 OK)
```

❌ **Extra trailing slash:**
```env
VITE_API_BASE=http://localhost:4000/api/  # Wrong!
# Results in: http://localhost:4000/api//projects (may work but inconsistent)
```

✅ **No trailing slash:**
```env
VITE_API_BASE=http://localhost:4000/api  # Correct!
```

**Protocol Considerations:**

**Development:**
```env
VITE_API_BASE=http://localhost:4000/api  # HTTP is fine
```

**Production:**
```env
VITE_API_BASE=https://api.example.com  # HTTPS required
```

⚠️ **Warning:** Browsers block mixed content (HTTPS frontend calling HTTP backend). Both must use HTTPS in production.

**CORS Requirements:**

The backend's `FRONTEND_URL` must allow the frontend origin:

**Example 1: Same host, different ports**
```env
# Frontend .env
VITE_API_BASE=http://localhost:4000/api

# Backend .env
FRONTEND_URL=http://localhost:5173  # Vite dev server
```

**Example 2: Docker containers**
```env
# Frontend .env
VITE_API_BASE=http://localhost:4000/api

# Backend .env
FRONTEND_URL=http://localhost:3000  # Frontend container
```

**Example 3: Production**
```env
# Frontend .env
VITE_API_BASE=https://api.example.com

# Backend .env
FRONTEND_URL=https://app.example.com
```

**Testing API Connection:**

```javascript
// Open browser console on frontend
fetch(import.meta.env.VITE_API_BASE + '/projects')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Troubleshooting:**

**Error: Network Error / Failed to fetch**
```
Possible Causes:
1. Backend not running (check docker-compose ps)
2. Wrong VITE_API_BASE URL
3. CORS blocked (check backend FRONTEND_URL)
4. Firewall blocking port

Solutions:
1. Start backend: docker-compose up backend
2. Verify URL: curl http://localhost:4000/api/projects
3. Update backend FRONTEND_URL to match frontend origin
4. Check firewall rules
```

**Error: 404 Not Found**
```
Possible Causes:
1. Missing /api in VITE_API_BASE
2. Backend route not registered

Solutions:
1. Add /api: VITE_API_BASE=http://localhost:4000/api
2. Check backend routes in routes/*.ts
```

**Error: CORS Policy Blocked**
```
Possible Causes:
1. Backend FRONTEND_URL doesn't match frontend origin
2. Backend CORS not configured

Solutions:
1. Update backend/.env: FRONTEND_URL=http://localhost:5173
2. Restart backend: docker-compose restart backend
```

**Build-Time vs Runtime:**

Vite environment variables are embedded at **build time**:

```bash
# Development (runtime - can change without rebuild)
npm run dev
# Uses .env values, can change and refresh

# Production (build-time - fixed in build)
npm run build
# .env values baked into dist/
# Must rebuild if VITE_API_BASE changes
```

**Multiple Environments:**

For different deployment environments:

```bash
# Development
.env.development:
  VITE_API_BASE=http://localhost:4000/api

# Staging
.env.staging:
  VITE_API_BASE=https://api-staging.example.com

# Production
.env.production:
  VITE_API_BASE=https://api.example.com
```

Build for specific environment:
```bash
npm run build -- --mode production
```

**Related Configuration:**
- Backend FRONTEND_URL must allow frontend origin
- Both must use same protocol (HTTP or HTTPS)
- Port numbers must match actual backend deployment

---

## Configuration Examples

### Development Environment

**Complete Configuration:**

```env
# backend/.env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/spd
FRONTEND_URL=http://localhost:5173
LOG_TO_FILE=true
LOG_RETENTION_DAYS=7
LOG_LEVEL=debug
MONITORING_INTERVAL_MINUTES=15
```

```env
# frontend/.env
VITE_API_BASE=http://localhost:4000/api
```

**Characteristics:**
- Local MongoDB
- Verbose logging (debug)
- Short retention (7 days)
- Frequent monitoring (15 min)
- Vite dev server

---

### Docker Environment

**Complete Configuration:**

```env
# backend/.env
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/spd
FRONTEND_URL=http://localhost:3000
LOG_TO_FILE=true
LOG_RETENTION_DAYS=30
LOG_LEVEL=info
MONITORING_INTERVAL_MINUTES=60
```

```env
# frontend/.env
VITE_API_BASE=http://localhost:4000/api
```

**Characteristics:**
- Docker service name (mongo)
- Production mode
- Standard logging (info)
- Standard retention (30 days)
- Hourly monitoring

---

### Production Environment

**Complete Configuration:**

```env
# backend/.env
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb+srv://produser:SecurePass123@cluster0.abc.mongodb.net/spd?retryWrites=true&w=majority
FRONTEND_URL=https://spd-milestones.example.com
LOG_TO_FILE=true
LOG_RETENTION_DAYS=90
LOG_LEVEL=info
MONITORING_INTERVAL_MINUTES=60
```

```env
# frontend/.env
VITE_API_BASE=https://spd-milestones.example.com/api
```

**Characteristics:**
- MongoDB Atlas
- HTTPS everywhere
- Longer retention (90 days)
- Production logging (info)
- Standard monitoring

---

### Staging Environment

**Complete Configuration:**

```env
# backend/.env
PORT=4000
NODE_ENV=staging
MONGO_URI=mongodb://staging-mongo:27017/spd
FRONTEND_URL=https://staging.spd-milestones.example.com
LOG_TO_FILE=true
LOG_RETENTION_DAYS=30
LOG_LEVEL=debug
MONITORING_INTERVAL_MINUTES=30
```

```env
# frontend/.env
VITE_API_BASE=https://staging.spd-milestones.example.com/api
```

**Characteristics:**
- Staging database
- Debug logging (for troubleshooting)
- Frequent monitoring (30 min)
- Production-like infrastructure

---

### High-Load Production

**Complete Configuration:**

```env
# backend/.env
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb+srv://produser:SecurePass123@cluster0.abc.mongodb.net/spd?retryWrites=true&w=majority&maxPoolSize=50
FRONTEND_URL=https://spd-milestones.example.com
LOG_TO_FILE=true
LOG_RETENTION_DAYS=30
LOG_LEVEL=warn
MONITORING_INTERVAL_MINUTES=120
```

**Characteristics:**
- Minimal logging (warn)
- Shorter retention (disk space)
- Less frequent monitoring (2 hours)
- Increased connection pool

---

## Environment-Specific Configurations

### Local Development

**When to use:** Developing on your local machine

**Setup:**
```bash
# Install MongoDB locally
# Or use Docker: docker run -d -p 27017:27017 mongo:4.4

# Backend
cd backend
cp .env.example .env
# Edit .env (use localhost)
npm install
npm run dev

# Frontend  
cd frontend
# .env already configured for localhost
npm install
npm run dev
```

**Configuration:**
- MONGO_URI: `mongodb://localhost:27017/spd`
- FRONTEND_URL: `http://localhost:5173`
- VITE_API_BASE: `http://localhost:4000/api`
- LOG_LEVEL: `debug`
- MONITORING_INTERVAL_MINUTES: `15`

---

### Docker Desktop

**When to use:** Testing containerized deployment locally

**Setup:**
```powershell
# Ensure .env files are configured for Docker
.\deploy-docker.ps1
# Or: docker-compose up -d --build
```

**Configuration:**
- MONGO_URI: `mongodb://mongo:27017/spd` (service name)
- FRONTEND_URL: `http://localhost:3000`
- VITE_API_BASE: `http://localhost:4000/api`
- LOG_LEVEL: `info`
- MONITORING_INTERVAL_MINUTES: `60`

---

### Cloud Production (Heroku, AWS, Azure, GCP)

**When to use:** Deploying to cloud platforms

**Configuration:**
- MONGO_URI: Use MongoDB Atlas or cloud database
- FRONTEND_URL: Your production domain (HTTPS)
- VITE_API_BASE: Your API domain (HTTPS)
- LOG_LEVEL: `info` or `warn`
- MONITORING_INTERVAL_MINUTES: `60` or `120`

**Additional Considerations:**
- Use environment-specific secrets management
- Enable HTTPS/SSL
- Configure CDN for frontend
- Set up monitoring/alerting
- Configure backup policies

---

## Validation & Troubleshooting

### Configuration Validation

**Check Backend Configuration:**

```powershell
# View current configuration
docker-compose exec backend printenv | Select-String "PORT|NODE_ENV|MONGO_URI|LOG|MONITORING"

# Expected output:
# PORT=4000
# NODE_ENV=production
# MONGO_URI=mongodb://mongo:27017/spd
# LOG_TO_FILE=true
# LOG_RETENTION_DAYS=30
# LOG_LEVEL=info
# MONITORING_INTERVAL_MINUTES=60
```

**Check Frontend Configuration:**

```powershell
# View Vite environment
docker-compose exec frontend printenv | Select-String "VITE"

# Expected output:
# VITE_API_BASE=http://localhost:4000/api
```

**Test API Connection:**

```powershell
# Test health endpoint
Invoke-WebRequest http://localhost:4000/health

# Expected: 200 OK
# {"status":"ok","timestamp":"..."}

# Test API endpoint
Invoke-WebRequest http://localhost:4000/api/projects

# Expected: 200 OK (or empty array)
```

---

### Common Configuration Issues

#### Issue 1: Database Connection Failed

**Error Message:**
```
MongoNetworkError: failed to connect to server [localhost:27017]
```

**Possible Causes:**
1. MongoDB not running
2. Wrong MONGO_URI
3. Network connectivity

**Solutions:**
```powershell
# Check MongoDB is running
docker-compose ps mongo
# Should show "Up (healthy)"

# Verify MONGO_URI in backend/.env
Get-Content backend\.env | Select-String "MONGO_URI"

# For Docker: MONGO_URI=mongodb://mongo:27017/spd
# For Local: MONGO_URI=mongodb://localhost:27017/spd

# Restart backend
docker-compose restart backend
```

---

#### Issue 2: CORS Blocked

**Error Message (Browser Console):**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Possible Causes:**
1. FRONTEND_URL doesn't match frontend origin
2. CORS not configured

**Solutions:**
```powershell
# Check FRONTEND_URL in backend/.env
Get-Content backend\.env | Select-String "FRONTEND_URL"

# Should match frontend origin exactly:
# Development: http://localhost:5173
# Docker: http://localhost:3000
# Production: https://your-domain.com

# Update if wrong
"FRONTEND_URL=http://localhost:3000" | Out-File backend\.env -Append

# Restart backend
docker-compose restart backend
```

---

#### Issue 3: Logs Not Writing to Files

**Symptoms:**
- No files in `logs/` directory
- Monitoring stats endpoint shows no log files

**Possible Causes:**
1. LOG_TO_FILE=false
2. Directory permissions
3. Volume not mounted (Docker)

**Solutions:**
```powershell
# Check LOG_TO_FILE setting
Get-Content backend\.env | Select-String "LOG_TO_FILE"
# Should be: LOG_TO_FILE=true

# Check logs directory exists
Test-Path logs
# Should return: True

# Check Docker volume mount
docker-compose config | Select-String "logs"
# Should show: - ./logs:/app/logs

# Check file permissions
Get-Acl logs

# Restart backend
docker-compose restart backend

# Verify logs are being written
Get-ChildItem logs
```

---

#### Issue 4: Monitoring Not Running

**Symptoms:**
- No monitoring logs
- Report API endpoint returns empty

**Possible Causes:**
1. MONITORING_INTERVAL_MINUTES not set
2. Backend not started properly

**Solutions:**
```powershell
# Check monitoring interval
Get-Content backend\.env | Select-String "MONITORING"
# Should be: MONITORING_INTERVAL_MINUTES=60

# Check backend logs for monitoring startup
docker-compose logs backend | Select-String "Monitoring"
# Should show: "Monitoring service started with interval: 60 minutes"

# Manually trigger monitoring
Invoke-WebRequest http://localhost:4000/api/monitoring/report

# Restart backend
docker-compose restart backend
```

---

## Security Best Practices

### 1. Environment File Security

**❌ Never commit .env files to Git:**

```bash
# .gitignore (already configured)
.env
.env.local
.env.*.local
```

**✅ Use .env.example as template:**

```bash
# Committed to Git (no secrets)
backend/.env.example

# Local only (contains secrets)
backend/.env
```

---

### 2. Database Credentials

**❌ Weak credentials:**
```env
MONGO_URI=mongodb://admin:admin@localhost:27017/spd
MONGO_URI=mongodb://root:password@localhost:27017/spd
```

**✅ Strong credentials:**
```env
MONGO_URI=mongodb://admin:Zx9$mK2#pL4&vN8@localhost:27017/spd?authSource=admin
```

**Password Requirements:**
- Minimum 16 characters
- Uppercase + lowercase + numbers + symbols
- No dictionary words
- Unique per environment
- Rotated every 90 days

---

### 3. CORS Configuration

**❌ Insecure:**
```env
FRONTEND_URL=*  # NEVER do this in production
```

**✅ Secure:**
```env
FRONTEND_URL=https://spd-milestones.example.com  # Specific domain only
```

---

### 4. Production Checklist

- [ ] NODE_ENV=production
- [ ] Strong database password
- [ ] HTTPS for all URLs
- [ ] CORS restricted to specific domain
- [ ] LOG_LEVEL=info or warn (not debug)
- [ ] Secrets in environment variables (not code)
- [ ] .env files not in Git
- [ ] Regular credential rotation
- [ ] Monitoring enabled
- [ ] Backup policies configured

---

## Performance Tuning

### Low-Resource Environments

**Optimize for minimal resource usage:**

```env
NODE_ENV=production
LOG_TO_FILE=false  # Or use warn/error level
LOG_LEVEL=warn
LOG_RETENTION_DAYS=7
MONITORING_INTERVAL_MINUTES=360
```

**Savings:**
- Disk I/O: Reduced by 90%
- CPU: Reduced by 80%
- Storage: Reduced by 95%

---

### High-Load Environments

**Optimize for performance:**

```env
NODE_ENV=production
LOG_TO_FILE=true
LOG_LEVEL=warn
LOG_RETENTION_DAYS=30
MONITORING_INTERVAL_MINUTES=120
MONGO_URI=mongodb://...?maxPoolSize=50&minPoolSize=10
```

**Improvements:**
- Reduced logging overhead
- Less frequent monitoring
- Larger connection pool
- Better throughput

---

### Balanced Production

**Standard configuration (recommended):**

```env
NODE_ENV=production
LOG_TO_FILE=true
LOG_LEVEL=info
LOG_RETENTION_DAYS=30
MONITORING_INTERVAL_MINUTES=60
```

**Benefits:**
- Adequate logging for debugging
- Manageable disk usage
- Regular health monitoring
- Good performance

---

## Migration Guide

### From Development to Production

**Step 1: Update Environment Variables**

```bash
# Copy current .env as backup
cp backend/.env backend/.env.development

# Update for production
```

```env
# Change these:
NODE_ENV=production  # Was: development
MONGO_URI=mongodb+srv://...  # Was: mongodb://localhost...
FRONTEND_URL=https://...  # Was: http://localhost...
LOG_LEVEL=info  # Was: debug
LOG_RETENTION_DAYS=90  # Was: 7
```

**Step 2: Test Configuration**

```powershell
# Build and start
docker-compose up -d --build

# Verify services
docker-compose ps

# Test health
Invoke-WebRequest https://your-domain.com/health

# Run tests
Invoke-RestMethod -Uri https://your-domain.com/api/monitoring/test -Method Post
```

**Step 3: Monitor**

```powershell
# Watch logs
docker-compose logs -f backend

# Check monitoring
Invoke-WebRequest https://your-domain.com/api/monitoring/report
```

---

### From Local MongoDB to Atlas

**Step 1: Create MongoDB Atlas Cluster**

1. Sign up at mongodb.com/cloud/atlas
2. Create a cluster
3. Create database user
4. Whitelist IP address
5. Get connection string

**Step 2: Update Configuration**

```env
# Old (local)
MONGO_URI=mongodb://localhost:27017/spd

# New (Atlas)
MONGO_URI=mongodb+srv://username:password@cluster0.abc.mongodb.net/spd?retryWrites=true&w=majority
```

**Step 3: Migrate Data (Optional)**

```bash
# Export from local
mongodump --uri="mongodb://localhost:27017/spd" --out=./backup

# Import to Atlas
mongorestore --uri="mongodb+srv://username:password@cluster0.abc.mongodb.net/spd" ./backup/spd
```

---

## Appendix

### Default Values Summary

| Variable | Default Value | Type |
|----------|---------------|------|
| PORT | 4000 | Number |
| NODE_ENV | development | String |
| MONGO_URI | (required) | String |
| FRONTEND_URL | http://localhost:5173 | String |
| LOG_TO_FILE | false | Boolean |
| LOG_RETENTION_DAYS | 30 | Number |
| LOG_LEVEL | debug/info | String |
| MONITORING_INTERVAL_MINUTES | 60 | Number |
| VITE_API_BASE | http://localhost:4000/api | String |

---

### Environment Variable Precedence

1. **System Environment Variables** (highest priority)
2. **.env File**
3. **Default Values in Code** (lowest priority)

---

### Related Files

**Configuration:**
- `backend/.env` - Active backend configuration
- `backend/.env.example` - Configuration template
- `frontend/.env` - Active frontend configuration

**Code:**
- `backend/src/config/env.ts` - Environment loading
- `backend/src/server.ts` - Configuration usage
- `frontend/src/config/environment.ts` - Frontend config

**Documentation:**
- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment guide
- `CHANGELOG.md` - Version history

---

## Support

For configuration issues:

1. **Review this document** - Comprehensive reference
2. **Check .env.example** - Template with inline comments
3. **Check DEPLOYMENT.md** - Deployment-specific guidance
4. **Check logs** - `docker-compose logs backend`
5. **Test endpoints** - Verify connectivity and CORS

---

**Document Version:** 1.0.0  
**Last Updated:** November 3, 2025  
**Application Version:** SPD Milestones v1.0.0-beta.1
