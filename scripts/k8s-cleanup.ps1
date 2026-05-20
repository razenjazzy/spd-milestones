# Cleanup Kubernetes Deployment
# Removes all resources from the spd-milestones namespace
# Works with both Docker Desktop and kind clusters

param(
    [switch]$KeepNamespace,
    [switch]$Force
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Kubernetes Cleanup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Show current context
$currentContext = kubectl config current-context 2>$null
Write-Host "Current context: $currentContext" -ForegroundColor Cyan
Write-Host ""

# Check if namespace exists
$namespaceExists = kubectl get namespace spd-milestones 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Namespace 'spd-milestones' not found. Nothing to clean up." -ForegroundColor Yellow
    exit 0
}

if (-not $Force) {
    Write-Host "This will delete all resources in the spd-milestones namespace." -ForegroundColor Yellow
    Write-Host ""
    kubectl get all -n spd-milestones
    Write-Host ""
    $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Cleaning up resources..." -ForegroundColor Yellow
Write-Host ""

if ($KeepNamespace) {
    Write-Host "Deleting deployments..." -ForegroundColor Cyan
    kubectl delete deployment --all -n spd-milestones
    
    Write-Host "Deleting services..." -ForegroundColor Cyan
    kubectl delete service --all -n spd-milestones
    
    Write-Host "Deleting persistent volume claims..." -ForegroundColor Cyan
    kubectl delete pvc --all -n spd-milestones
    
    Write-Host "Deleting ingress..." -ForegroundColor Cyan
    kubectl delete ingress --all -n spd-milestones 2>$null
    
    Write-Host ""
    Write-Host "✓ Resources deleted (namespace preserved)" -ForegroundColor Green
} else {
    Write-Host "Deleting namespace (this will remove all resources)..." -ForegroundColor Cyan
    kubectl delete namespace spd-milestones
    
    # Wait for namespace to be fully deleted
    Write-Host "Waiting for namespace to be fully deleted..." -ForegroundColor Cyan
    $timeout = 60
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $nsExists = kubectl get namespace spd-milestones 2>$null
        if ($LASTEXITCODE -ne 0) {
            break
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    # Also clean up persistent volumes if they exist
    Write-Host "Cleaning up persistent volumes..." -ForegroundColor Cyan
    kubectl delete pv mongo-pv 2>$null
    
    Write-Host ""
    Write-Host "✓ Complete cleanup finished" -ForegroundColor Green
}

Write-Host ""
Write-Host "To redeploy, run: .\scripts\deploy-k8s-docker-desktop.ps1" -ForegroundColor Cyan
Write-Host ""
