# Deploy to existing kind cluster
# Optimized for kind with image loading

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "kind Cluster Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Find kind cluster and context
Write-Host "Checking for kind clusters..." -ForegroundColor Yellow

# Get all contexts and find kind contexts
$contextsOutput = kubectl config get-contexts -o name 2>&1 | Out-String
$kindContexts = ($contextsOutput -split "`n" | Where-Object { $_ -match "^kind-" }).Trim()

if ($kindContexts.Count -eq 0 -or [string]::IsNullOrWhiteSpace($kindContexts)) {
    Write-Host "ERROR: No kind context found" -ForegroundColor Red
    Write-Host "Available contexts:" -ForegroundColor Yellow
    kubectl config get-contexts
    Write-Host ""
    Write-Host "To create a cluster: kind create cluster --config k8s/kind-config.yaml" -ForegroundColor Yellow
    exit 1
}

# Use first kind context
$contextName = if ($kindContexts -is [array]) { $kindContexts[0] } else { $kindContexts }
$clusterName = $contextName -replace "^kind-", ""

Write-Host "Found kind context: $contextName" -ForegroundColor Green
Write-Host "Cluster name: $clusterName" -ForegroundColor Green
Write-Host ""

# Switch to kind context
Write-Host "Switching to context: $contextName" -ForegroundColor Yellow
kubectl config use-context $contextName
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not switch to $contextName" -ForegroundColor Red
    Write-Host "Available contexts:" -ForegroundColor Yellow
    kubectl config get-contexts
    exit 1
}
Write-Host "âœ" Context switched" -ForegroundColor Green
Write-Host ""

# Step 1: Stop Docker Compose
Write-Host "[Step 1/7] Stopping Docker Compose..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "âœ" Docker Compose stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Build images
Write-Host "[Step 2/7] Building Docker images..." -ForegroundColor Yellow
Write-Host "Building backend..." -ForegroundColor Cyan
docker build -t spd-milestones-backend:latest -f backend/Dockerfile --target production backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build backend image" -ForegroundColor Red
    exit 1
}

Write-Host "Building graphql (same as backend)..." -ForegroundColor Cyan
docker tag spd-milestones-backend:latest spd-milestones-graphql:latest

Write-Host "Building frontend..." -ForegroundColor Cyan
docker build -t spd-milestones-frontend:latest -f frontend/Dockerfile --target development frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build frontend image" -ForegroundColor Red
    exit 1
}

Write-Host "âœ" Images built" -ForegroundColor Green
Write-Host ""

# Step 3: Load images into kind
Write-Host "[Step 3/7] Loading images into kind cluster..." -ForegroundColor Yellow
Write-Host "Loading backend..." -ForegroundColor Cyan
kind load docker-image spd-milestones-backend:latest --name $clusterName
Write-Host "Loading graphql..." -ForegroundColor Cyan
kind load docker-image spd-milestones-graphql:latest --name $clusterName
Write-Host "Loading frontend..." -ForegroundColor Cyan
kind load docker-image spd-milestones-frontend:latest --name $clusterName
Write-Host "âœ" Images loaded into kind" -ForegroundColor Green
Write-Host ""

# Step 4: Create namespace
Write-Host "[Step 4/7] Creating namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml
Write-Host "âœ" Namespace created" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy MongoDB
Write-Host "[Step 5/7] Deploying MongoDB..." -ForegroundColor Yellow
kubectl apply -f k8s/mongodb-pv.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

Write-Host "Waiting for MongoDB..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=mongodb -n spd-milestones --timeout=300s 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "âœ" MongoDB ready" -ForegroundColor Green
}
else {
    Write-Host "âš  MongoDB timeout - checking status..." -ForegroundColor Yellow
    kubectl get pods -n spd-milestones -l app=mongodb
}
Write-Host ""

# Step 6: Deploy Backend & GraphQL
Write-Host "[Step 6/7] Deploying Backend and GraphQL..." -ForegroundColor Yellow
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/graphql-deployment.yaml

Write-Host "Waiting for Backend..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=backend -n spd-milestones --timeout=300s 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "âœ" Backend ready" -ForegroundColor Green
}

Write-Host "Waiting for GraphQL..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=graphql -n spd-milestones --timeout=300s 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "âœ" GraphQL ready" -ForegroundColor Green
}
Write-Host ""

# Step 7: Deploy Frontend
Write-Host "[Step 7/7] Deploying Frontend..." -ForegroundColor Yellow
kubectl apply -f k8s/frontend-deployment.yaml

Write-Host "Waiting for Frontend..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=frontend -n spd-milestones --timeout=300s 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "âœ" Frontend ready" -ForegroundColor Green
}
Write-Host ""

# Show status
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Deployment Status" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
kubectl get all -n spd-milestones
Write-Host ""

# Show access information
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Access Your Application" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your kind cluster exposes ports on localhost:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:4000" -ForegroundColor Cyan
Write-Host "  GraphQL:   http://localhost:4001/graphql" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: If ports are not accessible, use port-forwarding:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward svc/frontend 3000:3000 -n spd-milestones" -ForegroundColor White
Write-Host "  kubectl port-forward svc/backend 4000:4000 -n spd-milestones" -ForegroundColor White
Write-Host "  kubectl port-forward svc/graphql 4001:4001 -n spd-milestones" -ForegroundColor White
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  Status:    .\scripts\k8s-status.ps1" -ForegroundColor White
Write-Host "  Logs:      .\scripts\k8s-status.ps1 -Logs" -ForegroundColor White
Write-Host "  Cleanup:   .\scripts\k8s-cleanup.ps1" -ForegroundColor White
Write-Host ""
