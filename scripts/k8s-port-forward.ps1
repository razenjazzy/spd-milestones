# Quick Port Forward Script for Docker Desktop Kubernetes
# This opens port forwards to all services in separate PowerShell windows

Write-Host "Starting port forwards for SPD Milestones..." -ForegroundColor Cyan
Write-Host ""

# Check if namespace exists
$namespaceExists = kubectl get namespace spd-milestones 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Namespace 'spd-milestones' not found. Please deploy first." -ForegroundColor Red
    Write-Host "Run: .\scripts\deploy-k8s-docker-desktop.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if services exist
$services = kubectl get svc -n spd-milestones -o name 2>$null
if ($LASTEXITCODE -ne 0 -or -not $services) {
    Write-Host "ERROR: No services found in spd-milestones namespace" -ForegroundColor Red
    exit 1
}

Write-Host "Opening port forwards in separate windows..." -ForegroundColor Yellow
Write-Host ""

# Start frontend port forward in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host 'Frontend Port Forward' -ForegroundColor Cyan; kubectl port-forward svc/frontend 3000:3000 -n spd-milestones"

# Start backend port forward in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host 'Backend Port Forward' -ForegroundColor Cyan; kubectl port-forward svc/backend 4000:4000 -n spd-milestones"

# Start graphql port forward in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host 'GraphQL Port Forward' -ForegroundColor Cyan; kubectl port-forward svc/graphql 4001:4001 -n spd-milestones"

Start-Sleep -Seconds 2

Write-Host "✓ Port forwards started in separate windows" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:4000" -ForegroundColor Cyan
Write-Host "  GraphQL:   http://localhost:4001/graphql" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop port forwards, close the PowerShell windows" -ForegroundColor White
Write-Host ""
