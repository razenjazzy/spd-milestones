# Multi-stage build for optimized production image
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies with optimized network settings
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production && \
    npm ci --only=development

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install timezone data for Alpine Linux
RUN apk add --no-cache tzdata

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create logs directory for log file manager
RUN mkdir -p logs/archive && \
    chown -R node:node logs

# Use non-root user for security
USER node

# Set environment to production
ENV NODE_ENV=production
ENV LOG_TO_FILE=true
ENV LOG_RETENTION_DAYS=30
ENV MONITORING_INTERVAL_MINUTES=60

# Persist logs directory
VOLUME ["/app/logs"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/health || exit 1

EXPOSE 4000

CMD ["node", "dist/server.js"]
