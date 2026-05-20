# Fix npm timeout issues in Dockerfile
# This script updates Dockerfiles to use npm mirror for faster downloads

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Fix npm Timeout Issues" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will update your Dockerfiles to use a faster npm registry" -ForegroundColor Yellow
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "  1. Taobao Mirror (registry.npmmirror.com) - Fast in Asia" -ForegroundColor White
Write-Host "  2. npmjs.org (default) - Official registry" -ForegroundColor White
Write-Host "  3. Custom registry" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choose option (1/2/3)"

$registry = switch ($choice) {
    "1" { "https://registry.npmmirror.com" }
    "2" { "https://registry.npmjs.org" }
    "3" { Read-Host "Enter custom registry URL" }
    default { "https://registry.npmmirror.com" }
}

Write-Host ""
Write-Host "Using registry: $registry" -ForegroundColor Green
Write-Host ""

# Backup Dockerfile
Write-Host "Creating backup..." -ForegroundColor Yellow
Copy-Item backend/Dockerfile backend/Dockerfile.backup -Force
Write-Host "✓ Backup created: backend/Dockerfile.backup" -ForegroundColor Green
Write-Host ""

# Read current Dockerfile
$dockerfileContent = Get-Content backend/Dockerfile -Raw

# Check if registry is already configured
if ($dockerfileContent -match "npm config set registry") {
    Write-Host "Registry already configured in Dockerfile" -ForegroundColor Yellow
    Write-Host ""
    $replace = Read-Host "Replace existing configuration? (yes/no)"
    if ($replace -ne "yes") {
        Write-Host "Operation cancelled" -ForegroundColor Yellow
        exit 0
    }
    
    # Remove existing registry configuration
    $dockerfileContent = $dockerfileContent -replace "RUN npm config set registry[^\n]*\n", ""
}

# Add registry configuration before npm ci commands
$registryCommand = "RUN npm config set registry $registry"

# Find the builder stage npm ci section
$builderPattern = "(# Install dependencies with optimized network settings\s+)(RUN npm config set fetch-timeout)"
$dockerfileContent = $dockerfileContent -replace $builderPattern, "`$1$registryCommand`n`$2"

# Find the production stage npm ci section  
$prodPattern = "(# Install only production dependencies\s+)(RUN npm config set fetch-timeout)"
$dockerfileContent = $dockerfileContent -replace $prodPattern, "`$1$registryCommand`n`$2"

# Save updated Dockerfile
Set-Content -Path backend/Dockerfile -Value $dockerfileContent -NoNewline

Write-Host "✓ Dockerfile updated with npm registry configuration" -ForegroundColor Green
Write-Host ""

Write-Host "Changes made:" -ForegroundColor Cyan
Write-Host "  - Added: npm config set registry $registry" -ForegroundColor White
Write-Host "  - Backup: backend/Dockerfile.backup" -ForegroundColor White
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Build images: docker-compose build" -ForegroundColor Cyan
Write-Host "  2. Deploy to kind: .\scripts\deploy-kind-simple.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "To revert changes:" -ForegroundColor Yellow
Write-Host "  Copy-Item backend/Dockerfile.backup backend/Dockerfile -Force" -ForegroundColor Cyan
Write-Host ""
