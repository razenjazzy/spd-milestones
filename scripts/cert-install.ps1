# 1. Remove old certificates
$certs = Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object {$_.Subject -like "*spd.milestones*"}
foreach ($cert in $certs) {
    Remove-Item -Path "Cert:\LocalMachine\Root\$($cert.Thumbprint)" -Force
    Write-Host "Removed old certificate: $($cert.Thumbprint)"
}

# 2. Import the NEW certificate
$newCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("d:\spd-milestones\nginx\certs\spd.milestones.crt")
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root","LocalMachine")
$store.Open("ReadWrite")
$store.Add($newCert)
$store.Close()
Write-Host "New certificate imported with SAN support!"
Write-Host "Thumbprint: $($newCert.Thumbprint)"