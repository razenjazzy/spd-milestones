# Fix Image Loading for kind Cluster
# This script properly loads images and restarts pods

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Fix kind Cluster Image Issues" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verify we're on the right context
kubectl config use-context docker-desktop | Out-Null

# Step 1: Load images into kind cluster
Write-Host "[1/3] Loading images into kind cluster..." -ForegroundColor Yellow
Write-Host "This will take a few minutes..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Loading backend image..." -ForegroundColor White
kind load docker-image spd-milestones-backend:latest --name desktop

Write-Host "Loading graphql image..." -ForegroundColor White
kind load docker-image spd-milestones-graphql:latest --name desktop

Write-Host "Loading frontend image..." -ForegroundColor White
kind load docker-image spd-milestones-frontend:latest --name desktop

Write-Host ""
Write-Host "âœ" Images loaded into cluster" -ForegroundColor Green
Write-Host ""

# Step 2: Verify images are in nodes
Write-Host "[2/3] Verifying images in cluster nodes..." -ForegroundColor Yellow
$imageCheck = docker exec desktop-worker crictl images 2>$null | Select-String "spd-milestones"
if ($imageCheck) {
    Write-Host "âœ" Images found in worker nodes" -ForegroundColor Green
}
else {
    Write-Host "âš  Images not yet visible, but should be available shortly" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Delete pods to force recreation
Write-Host "[3/3] Restarting pods..." -ForegroundColor Yellow
kubectl delete pods --all -n spd-milestones --ignore-not-found=true

Write-Host "Waiting for new pods to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Current Pod Status" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

kubectl get pods -n spd-milestones

Write-Host ""
Write-Host "If pods still show ErrImageNeverPull:" -ForegroundColor Yellow
Write-Host "  1. Wait 30 seconds for images to propagate" -ForegroundColor White
Write-Host "  2. Delete pods again: kubectl delete pods --all -n spd-milestones" -ForegroundColor White
Write-Host "  3. Check again: kubectl get pods -n spd-milestones" -ForegroundColor White
Write-Host ""

Write-Host "To check logs: .\scripts\k8s-status.ps1 -Logs" -ForegroundColor Cyan
Write-Host ""
