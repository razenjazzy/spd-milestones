# Deploy to Kubernetes (kind cluster in Docker Desktop)

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Kubernetes Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verify kubectl connection
Write-Host "Checking cluster connection..." -ForegroundColor Yellow
kubectl config use-context docker-desktop | Out-Null
$nodes = kubectl get nodes --no-headers 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to cluster" -ForegroundColor Red
    Write-Host "Make sure Docker Desktop is running with Kubernetes enabled" -ForegroundColor Yellow
    exit 1
}

$nodeCount = ($nodes | Measure-Object).Count
Write-Host "Connected to cluster with $nodeCount nodes" -ForegroundColor Green
Write-Host ""

# Check and load images
Write-Host "Checking Docker images..." -ForegroundColor Yellow
$backendImage = docker images -q spd-milestones-backend:latest 2>$null
$frontendImage = docker images -q spd-milestones-frontend:latest 2>$null

if (-not $backendImage -or -not $frontendImage) {
    Write-Host "ERROR: Docker images not found" -ForegroundColor Red
    Write-Host "Build images first: docker-compose build" -ForegroundColor Yellow
    exit 1
}

docker tag spd-milestones-backend:latest spd-milestones-graphql:latest 2>$null
Write-Host "Images ready" -ForegroundColor Green
Write-Host ""

# Load images into kind cluster
Write-Host "Loading images into kind cluster..." -ForegroundColor Yellow
Write-Host "This takes 3-5 minutes..." -ForegroundColor Cyan

kind load docker-image spd-milestones-backend:latest --name desktop
kind load docker-image spd-milestones-graphql:latest --name desktop
kind load docker-image spd-milestones-frontend:latest --name desktop

Write-Host "Images loaded" -ForegroundColor Green
Write-Host ""

# Deploy Kubernetes resources
Write-Host "Deploying Kubernetes resources..." -ForegroundColor Yellow

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongodb-pv.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/graphql-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

Write-Host "Resources deployed" -ForegroundColor Green
Write-Host ""

# Wait and show status
Write-Host "Waiting for pods to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
kubectl get pods -n spd-milestones
Write-Host ""

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Access Your Application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start port forwarding:" -ForegroundColor Cyan
Write-Host "   .\scripts\k8s-port-forward.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "2. Then visit: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  Check status:  kubectl get pods -n spd-milestones" -ForegroundColor White
Write-Host "  View logs:     .\scripts\k8s-status.ps1 -Logs" -ForegroundColor White
Write-Host "  Cleanup:       .\scripts\k8s-cleanup.ps1" -ForegroundColor White
Write-Host ""
