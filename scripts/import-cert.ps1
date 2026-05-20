# Remove old spd.milestones certificates
Write-Host "Removing old certificates..." -ForegroundColor Yellow
$certs = Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object {$_.Subject -like "*spd.milestones*"}
foreach ($cert in $certs) {
    $thumbprint = $cert.Thumbprint
    Remove-Item -Path "Cert:\LocalMachine\Root\$thumbprint" -Force
    Write-Host "Removed certificate: $thumbprint" -ForegroundColor Red
}

# Import the NEW certificate
Write-Host "`nImporting new certificate with SAN..." -ForegroundColor Yellow
$certPath = "d:\spd-milestones\nginx\certs\spd.milestones.crt"
$newCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root","LocalMachine")
$store.Open("ReadWrite")
$store.Add($newCert)
$store.Close()

Write-Host "`nSUCCESS! Certificate imported to Trusted Root" -ForegroundColor Green
Write-Host "Thumbprint: $($newCert.Thumbprint)" -ForegroundColor Cyan
Write-Host "Subject: $($newCert.Subject)" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Close ALL browser windows completely"
Write-Host "2. Clear browser SSL state (Win+R -> inetcpl.cpl -> Content -> Clear SSL state)"
Write-Host "3. Restart browser and visit https://spd.milestones or https://localhost"
