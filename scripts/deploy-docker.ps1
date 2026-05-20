#!/usr/bin/env pwsh
# SPD Milestones - Docker Deployment Script
# Automates the deployment to Docker Desktop

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SPD Milestones v1.0.0-beta.1" -ForegroundColor Cyan
Write-Host "Docker Desktop Deployment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "Step 1: Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found or not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found!" -ForegroundColor Red
    exit 1
}

# Check if .env files exist
Write-Host "`nStep 2: Checking Configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "✅ backend\.env exists" -ForegroundColor Green
    
    # Check key configuration
    $envContent = Get-Content "backend\.env" -Raw
    if ($envContent -match "MONGO_URI=mongodb://mongo:27017/spd") {
        Write-Host "✅ MongoDB URI configured for Docker" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: MONGO_URI may not be configured for Docker" -ForegroundColor Yellow
        Write-Host "   Expected: MONGO_URI=mongodb://mongo:27017/spd" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ backend\.env not found!" -ForegroundColor Red
    Write-Host "Copying from backend\.env.example..." -ForegroundColor Yellow
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ Created backend\.env from template" -ForegroundColor Green
        Write-Host "⚠️  Please review and edit backend\.env if needed" -ForegroundColor Yellow
    } else {
        Write-Host "❌ backend\.env.example not found!" -ForegroundColor Red
        exit 1
    }
}

if (Test-Path "frontend\.env") {
    Write-Host "✅ frontend\.env exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  frontend\.env not found, creating default..." -ForegroundColor Yellow
    "VITE_API_BASE=http://localhost:4000/api" | Out-File -FilePath "frontend\.env" -Encoding UTF8
    Write-Host "✅ Created frontend\.env" -ForegroundColor Green
}

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ docker-compose.yml found" -ForegroundColor Green

# Ask user if they want to proceed
Write-Host "`nStep 3: Ready to Deploy" -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor White
Write-Host "  • Build backend Docker image" -ForegroundColor White
Write-Host "  • Build frontend Docker image" -ForegroundColor White
Write-Host "  • Pull MongoDB 4.4 image" -ForegroundColor White
Write-Host "  • Start all services" -ForegroundColor White
Write-Host "  • Create log directories" -ForegroundColor White
Write-Host ""
$response = Read-Host "Continue? (y/n)"

if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Create logs directory if it doesn't exist
Write-Host "`nStep 4: Creating Directories..." -ForegroundColor Yellow
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Host "✅ Created logs directory" -ForegroundColor Green
} else {
    Write-Host "✅ logs directory exists" -ForegroundColor Green
}

if (-not (Test-Path "logs\archive")) {
    New-Item -ItemType Directory -Path "logs\archive" | Out-Null
    Write-Host "✅ Created logs\archive directory" -ForegroundColor Green
} else {
    Write-Host "✅ logs\archive directory exists" -ForegroundColor Green
}

# Stop existing containers if running
Write-Host "`nStep 5: Stopping Existing Containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "✅ Cleaned up existing containers" -ForegroundColor Green

# Build and start services
Write-Host "`nStep 6: Building and Starting Services..." -ForegroundColor Yellow
Write-Host "This may take 2-5 minutes on first run..." -ForegroundColor Cyan

$startTime = Get-Date
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    $duration = (Get-Date) - $startTime
    Write-Host "✅ Services started successfully in $([math]::Round($duration.TotalSeconds, 1)) seconds!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    exit 1
}

# Wait a bit for services to initialize
Write-Host "`nStep 7: Waiting for Services to Initialize..." -ForegroundColor Yellow
Write-Host "Waiting 15 seconds for health checks..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Check service status
Write-Host "`nStep 8: Checking Service Status..." -ForegroundColor Yellow
docker-compose ps

# Test backend health
Write-Host "`nStep 9: Testing Backend Health..." -ForegroundColor Yellow
$maxRetries = 5
$retryCount = 0
$healthOk = $false

while ($retryCount -lt $maxRetries -and -not $healthOk) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is healthy!" -ForegroundColor Green
            $healthOk = $true
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "⏳ Waiting for backend... (Attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        } else {
            Write-Host "⚠️  Backend health check failed after $maxRetries attempts" -ForegroundColor Yellow
            Write-Host "The service may still be starting. Check logs with: docker-compose logs backend" -ForegroundColor Yellow
        }
    }
}

# Run tests if backend is healthy
if ($healthOk) {
    Write-Host "`nStep 10: Running Automated Tests..." -ForegroundColor Yellow
    try {
        $testResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/monitoring/test" -Method Post -UseBasicParsing -TimeoutSec 30
        if ($testResponse.success) {
            Write-Host "✅ Tests completed successfully!" -ForegroundColor Green
            Write-Host "   Total: $($testResponse.report.totalTests)" -ForegroundColor White
            Write-Host "   Passed: $($testResponse.report.passedTests)" -ForegroundColor Green
            Write-Host "   Failed: $($testResponse.report.failedTests)" -ForegroundColor $(if ($testResponse.report.failedTests -eq 0) { "Green" } else { "Red" })
        } else {
            Write-Host "⚠️  Some tests failed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not run tests: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Display summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ Docker containers are running!" -ForegroundColor Green
Write-Host "`nAccess your application:" -ForegroundColor Cyan
Write-Host "  • Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  • Backend:   http://localhost:4000/api" -ForegroundColor White
Write-Host "  • Health:    http://localhost:4000/health" -ForegroundColor White
Write-Host "  • Monitor:   http://localhost:4000/api/monitoring/report" -ForegroundColor White

Write-Host "`nUseful Commands:" -ForegroundColor Cyan
Write-Host "  • View logs:        docker-compose logs -f backend" -ForegroundColor White
Write-Host "  • Check status:     docker-compose ps" -ForegroundColor White
Write-Host "  • Stop services:    docker-compose down" -ForegroundColor White
Write-Host "  • Restart:          docker-compose restart" -ForegroundColor White

Write-Host "`nLog Files:" -ForegroundColor Cyan
Write-Host "  • Location:         .\logs\" -ForegroundColor White
Write-Host "  • Current log:      .\logs\app-$(Get-Date -Format 'yyyy-MM-dd').log" -ForegroundColor White
Write-Host "  • Archives:         .\logs\archive\" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  2. Create a project and add milestones" -ForegroundColor White
Write-Host "  3. View the Gantt chart" -ForegroundColor White
Write-Host "  4. Check monitoring: http://localhost:4000/api/monitoring/report" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete! 🚀" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
