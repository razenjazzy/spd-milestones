# Copy mkcert CA from CurrentUser to LocalMachine Root store
$mkcertCAs = Get-ChildItem Cert:\CurrentUser\Root | Where-Object {$_.Subject -like "*mkcert*"}
if ($mkcertCAs) {
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root","LocalMachine")
    $store.Open("ReadWrite")
    foreach ($cert in $mkcertCAs) {
        # Check if already exists
        $exists = Get-ChildItem Cert:\LocalMachine\Root | Where-Object {$_.Thumbprint -eq $cert.Thumbprint}
        if (-not $exists) {
            $store.Add($cert)
            Write-Host "Added: $($cert.Subject)" -ForegroundColor Green
        } else {
            Write-Host "Already exists: $($cert.Subject)" -ForegroundColor Yellow
        }
    }
    $store.Close()
    Write-Host "`nSUCCESS! mkcert CA(s) in LocalMachine Root store" -ForegroundColor Green
} else {
    Write-Host "ERROR: mkcert CA not found in CurrentUser store" -ForegroundColor Red
}
