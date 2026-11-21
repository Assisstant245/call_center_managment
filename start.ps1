# Starts the whole project: API (3000), forecast service (8000) and website (5173).
# Run:  right-click -> "Run with PowerShell"   or double-click start.bat

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# free the ports if an old copy is still running
foreach ($port in 3000, 8000, 5173) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Write-Host "Starting backend (API)..."
Start-Process powershell -WorkingDirectory "$root\call-center-backend" `
  -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='API :3000'; npm run start:dev"

Write-Host "Starting forecast service..."
Start-Process -FilePath "$root\forecasting-service\venv\Scripts\python.exe" `
  -WorkingDirectory "$root\forecasting-service" `
  -ArgumentList "-m", "uvicorn", "app:app", "--port", "8000"

Write-Host "Starting website..."
Start-Process powershell -WorkingDirectory $root `
  -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Website :5173'; npm run dev"

Write-Host ""
Write-Host "Wait about 20 seconds, then open:  http://localhost:5173"
Write-Host "Login:  demo-admin@demo.local  /  Demo#12345   (admin)"
Write-Host "        agent004@demo.local    /  Demo#12345   (agent)"
Start-Sleep -Seconds 20
Start-Process "http://localhost:5173"
