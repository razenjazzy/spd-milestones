# Deploy to kind cluster via Docker Desktop
# This script deploys to your 3-node kind cluster running in Docker Desktop

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Kubernetes Deployment to kind" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Use docker-desktop context (your kind cluster is accessible here)
Write-Host "Switching to docker-desktop context..." -ForegroundColor Yellow
kubectl config use-context docker-desktop
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not switch to docker-desktop" -ForegroundColor Red
    exit 1
}

# Verify cluster is accessible
$nodes = kubectl get nodes --no-headers 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to Kubernetes cluster" -ForegroundColor Red
    exit 1
}

$nodeCount = ($nodes | Measure-Object).Count
Write-Host "âœ" Connected to cluster with $nodeCount nodes" -ForegroundColor Green
Write-Host ""

# The cluster name for kind load commands
$clusterName = "desktop"

# Step 1: Stop Docker Compose
Write-Host "[Step 1/6] Stopping Docker Compose..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "âœ" Docker Compose stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Check for existing images
Write-Host "[Step 2/6] Checking Docker images..." -ForegroundColor Yellow

$backendImage = docker images -q spd-milestones-backend:latest 2>$null
$frontendImage = docker images -q spd-milestones-frontend:latest 2>$null

if ($backendImage -and $frontendImage) {
    Write-Host "âœ" Images found" -ForegroundColor Green
}
else {
    Write-Host "Images not found. Building with docker-compose..." -ForegroundColor Yellow
    Write-Host "This may take a while..." -ForegroundColor Cyan
    Write-Host ""
    
    docker-compose build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Build failed" -ForegroundColor Red
        Write-Host "See docs/NPM-TIMEOUT-FIX.md for solutions" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "âœ" Images built" -ForegroundColor Green
}

# Tag images
Write-Host "Tagging images..." -ForegroundColor Cyan
docker tag spd-milestones-backend:latest spd-milestones-graphql:latest 2>$null
Write-Host "âœ" Images ready" -ForegroundColor Green
Write-Host ""

# Step 3: Load images into kind cluster
Write-Host "[Step 3/6] Loading images into kind cluster..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan

Write-Host "  Loading backend..." -ForegroundColor White
kind load docker-image spd-milestones-backend:latest --name $clusterName

Write-Host "  Loading graphql..." -ForegroundColor White  
kind load docker-image spd-milestones-graphql:latest --name $clusterName

Write-Host "  Loading frontend..." -ForegroundColor White
kind load docker-image spd-milestones-frontend:latest --name $clusterName

Write-Host "âœ" Images loaded" -ForegroundColor Green
Write-Host ""

# Step 4: Create namespace
Write-Host "[Step 4/6] Creating namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml
Write-Host "âœ" Namespace created" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy MongoDB
Write-Host "[Step 5/6] Deploying MongoDB..." -ForegroundColor Yellow
kubectl apply -f k8s/mongodb-pv.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

Write-Host "Waiting for MongoDB to be ready (max 3 minutes)..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=mongodb -n spd-milestones --timeout=180s 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "âœ" MongoDB ready" -ForegroundColor Green
}
else {
    Write-Host "âš  MongoDB not ready yet, continuing..." -ForegroundColor Yellow
    kubectl get pods -n spd-milestones -l app=mongodb
}
Write-Host ""

# Step 6: Deploy Applications
Write-Host "[Step 6/6] Deploying applications..." -ForegroundColor Yellow

Write-Host "  Deploying Backend API..." -ForegroundColor White
kubectl apply -f k8s/backend-deployment.yaml

Write-Host "  Deploying GraphQL API..." -ForegroundColor White
kubectl apply -f k8s/graphql-deployment.yaml

Write-Host "  Deploying Frontend..." -ForegroundColor White
kubectl apply -f k8s/frontend-deployment.yaml

Write-Host ""
Write-Host "Waiting for pods to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "âœ" Deployment complete" -ForegroundColor Green
Write-Host ""

# Show status
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Deployment Status" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
kubectl get pods -n spd-milestones
Write-Host ""
kubectl get svc -n spd-milestones
Write-Host ""

# Show access information
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Access Your Application" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Use port forwarding:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Quick start (opens 3 terminals):" -ForegroundColor Cyan
Write-Host "  .\scripts\k8s-port-forward.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "Or run manually in separate terminals:" -ForegroundColor Cyan
Write-Host "  kubectl port-forward svc/frontend 3000:3000 -n spd-milestones" -ForegroundColor White
Write-Host "  kubectl port-forward svc/backend 4000:4000 -n spd-milestones" -ForegroundColor White
Write-Host "  kubectl port-forward svc/graphql 4001:4001 -n spd-milestones" -ForegroundColor White
Write-Host ""
Write-Host "Then access:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:   http://localhost:4000/health" -ForegroundColor Green
Write-Host "  GraphQL:   http://localhost:4001/graphql" -ForegroundColor Green
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  Check status:  .\scripts\k8s-status.ps1" -ForegroundColor White
Write-Host "  View logs:     .\scripts\k8s-status.ps1 -Logs" -ForegroundColor White
Write-Host "  Cleanup:       .\scripts\k8s-cleanup.ps1" -ForegroundColor White
Write-Host ""
