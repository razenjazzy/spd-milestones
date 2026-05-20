# Quick Fix for npm Timeout Issues

## Problem
npm install is timing out during Docker build with errors like:
```
npm error code ETIMEDOUT
npm error network request to https://registry.npmjs.org/... failed
```

## Solution Options

### Option 1: Use Faster npm Registry (Recommended)

Run the fix script to use a faster npm mirror:

```powershell
.\scripts\fix-npm-timeout.ps1
```

Choose option 1 for Taobao mirror (fast in Asia) or option 2 for official registry.

Then build and deploy:

```powershell
docker-compose build
.\scripts\deploy-kind-simple.ps1
```

### Option 2: Manual Dockerfile Fix

Edit `backend/Dockerfile` and add this line before each `npm ci` command:

```dockerfile
RUN npm config set registry https://registry.npmmirror.com
```

For example, in the builder stage:

```dockerfile
# Install dependencies with optimized network settings
RUN npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production && \
    npm ci --only=development
```

And in the production stage:

```dockerfile
# Install only production dependencies
RUN npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production
```

### Option 3: Build on Host Machine

If Docker builds keep failing, build dependencies on your host:

```powershell
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

Then modify Dockerfiles to copy `node_modules`:

In `backend/Dockerfile`, replace npm ci with:
```dockerfile
COPY node_modules ./node_modules
```

### Option 4: Use VPN or Better Network

If you're behind a restrictive firewall or proxy:
- Try using a VPN
- Try at a different time when network is less congested
- Check if your organization has an internal npm proxy

## Deploy to kind Cluster

Once images build successfully:

```powershell
.\scripts\deploy-kind-simple.ps1
```

This script:
- Checks for existing images
- Loads them into kind cluster
- Deploys all services
- Shows access instructions

## Alternative npm Registries

| Registry | URL | Best For |
|----------|-----|----------|
| Official | https://registry.npmjs.org | Default, worldwide |
| Taobao (npmmirror) | https://registry.npmmirror.com | China, Asia |
| Yarn | https://registry.yarnpkg.com | Alternative |
| GitHub | https://npm.pkg.github.com | Private packages |

## Check npm Configuration

To see current npm config:

```powershell
npm config list
```

To test registry access:

```powershell
npm ping --registry https://registry.npmmirror.com
```

## Troubleshooting

### Still timing out?

1. **Increase Docker resources**: Docker Desktop → Settings → Resources → Increase Memory/CPU

2. **Clear npm cache**:
   ```powershell
   docker system prune -a
   npm cache clean --force
   ```

3. **Use buildkit cache**:
   ```powershell
   $env:DOCKER_BUILDKIT=1
   docker-compose build
   ```

4. **Build with no cache to avoid corrupted layers**:
   ```powershell
   docker-compose build --no-cache
   ```

### Build succeeds but deployment fails?

Check logs:
```powershell
.\scripts\k8s-status.ps1 -Logs
```

Check pod status:
```powershell
kubectl get pods -n spd-milestones
kubectl describe pod <pod-name> -n spd-milestones
```

## Quick Deploy Commands

```powershell
# Fix npm timeout issue
.\scripts\fix-npm-timeout.ps1

# Build images
docker-compose build

# Deploy to kind
.\scripts\deploy-kind-simple.ps1

# Access application  
.\scripts\k8s-port-forward.ps1

# Check status
.\scripts\k8s-status.ps1 -Logs
```

## Need Help?

- Check Docker Desktop is running
- Ensure Kubernetes is enabled in Docker Desktop
- Verify kind cluster exists: `kind get clusters`
- Check context: `kubectl config current-context`
- View all contexts: `kubectl config get-contexts`
