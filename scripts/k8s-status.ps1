# Kubernetes Status and Monitoring Script
# Shows deployment status, pod health, and logs

param(
    [switch]$Logs,
    [switch]$Watch,
    [string]$Service = ""
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Kubernetes Deployment Status" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if namespace exists
$namespaceExists = kubectl get namespace spd-milestones 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Namespace 'spd-milestones' not found" -ForegroundColor Red
    Write-Host "Run deployment first: .\scripts\deploy-k8s-docker-desktop.ps1" -ForegroundColor Yellow
    exit 1
}

if ($Watch) {
    Write-Host "Watching pods (press Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host ""
    kubectl get pods -n spd-milestones --watch
    exit 0
}

# Show all resources
Write-Host "All Resources:" -ForegroundColor Yellow
kubectl get all -n spd-milestones
Write-Host ""

# Show pod details with status
Write-Host "Pod Details:" -ForegroundColor Yellow
kubectl get pods -n spd-milestones -o wide
Write-Host ""

# Show persistent volumes
Write-Host "Persistent Volumes:" -ForegroundColor Yellow
kubectl get pv,pvc -n spd-milestones
Write-Host ""

# Show service endpoints
Write-Host "Service Endpoints:" -ForegroundColor Yellow
kubectl get endpoints -n spd-milestones
Write-Host ""

if ($Logs) {
    if ($Service) {
        Write-Host "Recent logs for $Service`:" -ForegroundColor Yellow
        kubectl logs -l app=$Service -n spd-milestones --tail=50 --timestamps
    } else {
        Write-Host "Recent logs from all services:" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "=== MongoDB Logs ===" -ForegroundColor Cyan
        kubectl logs -l app=mongodb -n spd-milestones --tail=10 --timestamps 2>$null
        Write-Host ""
        
        Write-Host "=== Backend Logs ===" -ForegroundColor Cyan
        kubectl logs -l app=backend -n spd-milestones --tail=10 --timestamps 2>$null
        Write-Host ""
        
        Write-Host "=== GraphQL Logs ===" -ForegroundColor Cyan
        kubectl logs -l app=graphql -n spd-milestones --tail=10 --timestamps 2>$null
        Write-Host ""
        
        Write-Host "=== Frontend Logs ===" -ForegroundColor Cyan
        kubectl logs -l app=frontend -n spd-milestones --tail=10 --timestamps 2>$null
        Write-Host ""
    }
}

# Check pod health
Write-Host "Pod Health Status:" -ForegroundColor Yellow
$pods = kubectl get pods -n spd-milestones -o json | ConvertFrom-Json

foreach ($pod in $pods.items) {
    $name = $pod.metadata.name
    $ready = $pod.status.conditions | Where-Object { $_.type -eq "Ready" } | Select-Object -ExpandProperty status
    $phase = $pod.status.phase
    
    if ($ready -eq "True" -and $phase -eq "Running") {
        Write-Host "  ✓ $name - Running and Ready" -ForegroundColor Green
    } elseif ($phase -eq "Running") {
        Write-Host "  ⚠ $name - Running but not Ready" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ $name - $phase" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:        .\scripts\k8s-status.ps1 -Logs" -ForegroundColor White
Write-Host "  View service logs:.\scripts\k8s-status.ps1 -Logs -Service backend" -ForegroundColor White
Write-Host "  Watch pods:       .\scripts\k8s-status.ps1 -Watch" -ForegroundColor White
Write-Host "  Shell into pod:   kubectl exec -it [pod-name] -n spd-milestones -- /bin/sh" -ForegroundColor White
Write-Host "  Restart deploy:   kubectl rollout restart deployment/[name] -n spd-milestones" -ForegroundColor White
Write-Host ""
