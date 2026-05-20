# SPD Milestones - Deploy Application to Kubernetes
# This script deploys all application components to the kind cluster

Write-Host "🚀 Deploying SPD Milestones to Kubernetes" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if cluster exists
$clusterExists = kind get clusters 2>$null | Select-String "spd-cluster"
if (!$clusterExists) {
    Write-Host "❌ Cluster 'spd-cluster' not found!" -ForegroundColor Red
    Write-Host "   Run setup-cluster.ps1 first to create the cluster" -ForegroundColor Yellow
    exit 1
}

# Set kubectl context
Write-Host "🔧 Setting kubectl context..." -ForegroundColor Yellow
kubectl config use-context kind-spd-cluster

Write-Host ""
Write-Host "📦 Loading Docker images into kind cluster..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor White
Write-Host ""

# Load images into kind
kind load docker-image spd-milestones-backend:latest --name spd-cluster
kind load docker-image spd-milestones-graphql:latest --name spd-cluster
kind load docker-image spd-milestones-frontend:latest --name spd-cluster

Write-Host ""
Write-Host "✅ Docker images loaded!" -ForegroundColor Green
Write-Host ""

# Deploy in order
Write-Host "🗄️  Deploying MongoDB..." -ForegroundColor Yellow
kubectl apply -f ./k8s/mongodb-pv.yaml
kubectl apply -f ./k8s/mongodb-deployment.yaml

Write-Host "⏳ Waiting for MongoDB to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=mongodb -n spd-milestones --timeout=300s

Write-Host ""
Write-Host "🔧 Deploying Backend..." -ForegroundColor Yellow
kubectl apply -f ./k8s/backend-deployment.yaml

Write-Host "⏳ Waiting for Backend to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend -n spd-milestones --timeout=300s

Write-Host ""
Write-Host "🔧 Deploying GraphQL..." -ForegroundColor Yellow
kubectl apply -f ./k8s/graphql-deployment.yaml

Write-Host "⏳ Waiting for GraphQL to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=graphql -n spd-milestones --timeout=300s

Write-Host ""
Write-Host "🎨 Deploying Frontend..." -ForegroundColor Yellow
kubectl apply -f ./k8s/frontend-deployment.yaml

Write-Host "⏳ Waiting for Frontend to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=frontend -n spd-milestones --timeout=300s

Write-Host ""
Write-Host "🌐 Deploying Ingress..." -ForegroundColor Yellow
kubectl apply -f ./k8s/ingress.yaml

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""

# Display status
Write-Host "📊 Deployment Status:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""
kubectl get all -n spd-milestones

Write-Host ""
Write-Host "🌐 Ingress Configuration:" -ForegroundColor Cyan
kubectl get ingress -n spd-milestones

Write-Host ""
Write-Host "🎉 Application deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "  - Add to hosts file: 127.0.0.1 spd.milestones" -ForegroundColor White
Write-Host "  - Visit: http://spd.milestones" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  - View pods: kubectl get pods -n spd-milestones" -ForegroundColor White
Write-Host "  - View logs: kubectl logs -l app=backend -n spd-milestones" -ForegroundColor White
Write-Host "  - Scale deployment: kubectl scale deployment backend --replicas=3 -n spd-milestones" -ForegroundColor White
Write-Host "  - Delete deployment: kubectl delete -f ." -ForegroundColor White
Write-Host ""
