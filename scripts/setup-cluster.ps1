# SPD Milestones - Kind Multi-Node Kubernetes Cluster Setup Script
# This script creates a multi-node Kubernetes cluster using kind in Docker Desktop

Write-Host "🚀 SPD Milestones - Kubernetes Cluster Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if kind is installed
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
if (!(Get-Command kind -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kind is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install kind using one of these methods:" -ForegroundColor Yellow
    Write-Host "  1. Using Chocolatey: choco install kind" -ForegroundColor White
    Write-Host "  2. Using Scoop: scoop install kind" -ForegroundColor White
    Write-Host "  3. Download from: https://kind.sigs.k8s.io/docs/user/quick-start/#installation" -ForegroundColor White
    exit 1
}

# Check if kubectl is installed
if (!(Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install kubectl using one of these methods:" -ForegroundColor Yellow
    Write-Host "  1. Using Chocolatey: choco install kubernetes-cli" -ForegroundColor White
    Write-Host "  2. Using Scoop: scoop install kubectl" -ForegroundColor White
    Write-Host "  3. Download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/" -ForegroundColor White
    exit 1
}

Write-Host "✅ Prerequisites met (kind and kubectl are installed)" -ForegroundColor Green
Write-Host ""

# Check if cluster already exists
$clusterExists = kind get clusters 2>$null | Select-String "spd-cluster"
if ($clusterExists) {
    Write-Host "⚠️  Cluster 'spd-cluster' already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to delete it and create a new one? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "🗑️  Deleting existing cluster..." -ForegroundColor Yellow
        kind delete cluster --name spd-cluster
        Write-Host "✅ Existing cluster deleted" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit 0
    }
}

# Create the cluster
Write-Host "🏗️  Creating multi-node Kubernetes cluster..." -ForegroundColor Cyan
Write-Host "   - 1 Control Plane Node" -ForegroundColor White
Write-Host "   - 2 Worker Nodes" -ForegroundColor White
Write-Host ""

kind create cluster --config .\k8s\kind-config.yaml

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create cluster!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Cluster created successfully!" -ForegroundColor Green
Write-Host ""

# Wait for cluster to be ready
Write-Host "⏳ Waiting for cluster to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=Ready nodes --all --timeout=300s

Write-Host ""
Write-Host "📊 Cluster Information:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Display cluster info
kubectl cluster-info
Write-Host ""

# Display nodes
Write-Host "🖥️  Cluster Nodes:" -ForegroundColor Cyan
kubectl get nodes -o wide
Write-Host ""

# Install NGINX Ingress Controller
Write-Host "📦 Installing NGINX Ingress Controller..." -ForegroundColor Yellow
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

Write-Host "⏳ Waiting for ingress controller to be ready..." -ForegroundColor Yellow
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=300s

Write-Host ""
Write-Host "✅ NGINX Ingress Controller installed!" -ForegroundColor Green
Write-Host ""

# Create namespace for SPD Milestones
Write-Host "📁 Creating 'spd-milestones' namespace..." -ForegroundColor Yellow
kubectl create namespace spd-milestones
kubectl label namespace spd-milestones name=spd-milestones

Write-Host ""
Write-Host "✅ Namespace created!" -ForegroundColor Green
Write-Host ""

# Display final status
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""
Write-Host "Your multi-node Kubernetes cluster is ready!" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy applications: kubectl apply -f k8s/deployments/" -ForegroundColor White
Write-Host "  2. Check status: kubectl get all -n spd-milestones" -ForegroundColor White
Write-Host "  3. View nodes: kubectl get nodes" -ForegroundColor White
Write-Host "  4. Delete cluster: kind delete cluster --name spd-cluster" -ForegroundColor White
Write-Host ""
Write-Host "Cluster context: kind-spd-cluster" -ForegroundColor Yellow
Write-Host "Namespace: spd-milestones" -ForegroundColor Yellow
Write-Host ""
