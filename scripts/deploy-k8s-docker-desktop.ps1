# Deploy to Docker Desktop Kubernetes
# This script deploys the SPD Milestones application to Kubernetes on Docker Desktop

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Docker Desktop Kubernetes Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Kubernetes is enabled in Docker Desktop
Write-Host "Checking Kubernetes status..." -ForegroundColor Yellow
$kubectlVersion = kubectl version --client 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: kubectl is not available. Please enable Kubernetes in Docker Desktop:" -ForegroundColor Red
    Write-Host "  1. Open Docker Desktop" -ForegroundColor Yellow
    Write-Host "  2. Go to Settings > Kubernetes" -ForegroundColor Yellow
    Write-Host "  3. Check 'Enable Kubernetes'" -ForegroundColor Yellow
    Write-Host "  4. Click 'Apply & Restart'" -ForegroundColor Yellow
    exit 1
}

# Check if we're connected to docker-desktop context
$currentContext = kubectl config current-context 2>$null
if ($currentContext -ne "docker-desktop") {
    Write-Host "Switching to docker-desktop context..." -ForegroundColor Yellow
    kubectl config use-context docker-desktop
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Could not switch to docker-desktop context" -ForegroundColor Red
        Write-Host "Available contexts:" -ForegroundColor Yellow
        kubectl config get-contexts
        exit 1
    }
}

Write-Host "✓ Using Kubernetes context: docker-desktop" -ForegroundColor Green
Write-Host ""

# Step 1: Stop Docker Compose if running
Write-Host "[Step 1/8] Stopping Docker Compose..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "✓ Docker Compose stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Build Docker images
Write-Host "[Step 2/8] Building Docker images..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan

# Build backend image
docker build -t spd-milestones-backend:latest -f backend/Dockerfile --target production backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build backend image" -ForegroundColor Red
    exit 1
}

# Build graphql image (same as backend but different config)
docker build -t spd-milestones-graphql:latest -f backend/Dockerfile --target production backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build graphql image" -ForegroundColor Red
    exit 1
}

# Build frontend image
docker build -t spd-milestones-frontend:latest -f frontend/Dockerfile --target development frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build frontend image" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker images built successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Create namespace
Write-Host "[Step 3/8] Creating namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create namespace" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Namespace created" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy MongoDB
Write-Host "[Step 4/8] Deploying MongoDB..." -ForegroundColor Yellow
kubectl apply -f k8s/mongodb-pv.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

Write-Host "Waiting for MongoDB to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=mongodb -n spd-milestones --timeout=300s
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: MongoDB not ready within timeout. Checking status..." -ForegroundColor Yellow
    kubectl get pods -n spd-milestones -l app=mongodb
    kubectl logs -l app=mongodb -n spd-milestones --tail=20
}
Write-Host "✓ MongoDB deployed" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy Backend
Write-Host "[Step 5/8] Deploying Backend..." -ForegroundColor Yellow
kubectl apply -f k8s/backend-deployment.yaml

Write-Host "Waiting for Backend to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=backend -n spd-milestones --timeout=300s
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Backend not ready within timeout. Checking status..." -ForegroundColor Yellow
    kubectl get pods -n spd-milestones -l app=backend
}
Write-Host "✓ Backend deployed" -ForegroundColor Green
Write-Host ""

# Step 6: Deploy GraphQL
Write-Host "[Step 6/8] Deploying GraphQL..." -ForegroundColor Yellow
kubectl apply -f k8s/graphql-deployment.yaml

Write-Host "Waiting for GraphQL to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=graphql -n spd-milestones --timeout=300s
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: GraphQL not ready within timeout. Checking status..." -ForegroundColor Yellow
    kubectl get pods -n spd-milestones -l app=graphql
}
Write-Host "✓ GraphQL deployed" -ForegroundColor Green
Write-Host ""

# Step 7: Deploy Frontend
Write-Host "[Step 7/8] Deploying Frontend..." -ForegroundColor Yellow
kubectl apply -f k8s/frontend-deployment.yaml

Write-Host "Waiting for Frontend to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=frontend -n spd-milestones --timeout=300s
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Frontend not ready within timeout. Checking status..." -ForegroundColor Yellow
    kubectl get pods -n spd-milestones -l app=frontend
}
Write-Host "✓ Frontend deployed" -ForegroundColor Green
Write-Host ""

# Step 8: Display deployment status
Write-Host "[Step 8/8] Deployment Summary" -ForegroundColor Yellow
Write-Host ""
kubectl get all -n spd-milestones
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Access your application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 - Port Forwarding (Recommended for local access):" -ForegroundColor Cyan
Write-Host "  Run these commands in separate terminals:" -ForegroundColor White
Write-Host "  kubectl port-forward svc/frontend 3000:3000 -n spd-milestones" -ForegroundColor Green
Write-Host "  kubectl port-forward svc/backend 4000:4000 -n spd-milestones" -ForegroundColor Green
Write-Host "  kubectl port-forward svc/graphql 4001:4001 -n spd-milestones" -ForegroundColor Green
Write-Host "  Then visit: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 2 - Ingress (Requires NGINX Ingress Controller):" -ForegroundColor Cyan
Write-Host "  1. Install NGINX Ingress:" -ForegroundColor White
Write-Host "     kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml" -ForegroundColor Green
Write-Host "  2. Wait for ingress controller:" -ForegroundColor White
Write-Host "     kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s" -ForegroundColor Green
Write-Host "  3. Deploy ingress:" -ForegroundColor White
Write-Host "     kubectl apply -f k8s/ingress.yaml" -ForegroundColor Green
Write-Host "  4. Add to hosts file (C:\Windows\System32\drivers\etc\hosts):" -ForegroundColor White
Write-Host "     127.0.0.1 spd.milestones" -ForegroundColor Green
Write-Host "  5. Visit: http://spd.milestones" -ForegroundColor Yellow
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:        kubectl logs -l app=backend -n spd-milestones --tail=50" -ForegroundColor White
Write-Host "  View pods:        kubectl get pods -n spd-milestones" -ForegroundColor White
Write-Host "  Describe pod:     kubectl describe pod <pod-name> -n spd-milestones" -ForegroundColor White
Write-Host "  Shell into pod:   kubectl exec -it <pod-name> -n spd-milestones -- /bin/sh" -ForegroundColor White
Write-Host "  Delete all:       kubectl delete namespace spd-milestones" -ForegroundColor White
Write-Host ""
