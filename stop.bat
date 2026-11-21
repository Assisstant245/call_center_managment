@echo off
powershell -NoProfile -Command "foreach ($p in 3000,8000,5173) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } }; Write-Host 'All stopped.'"
pause
