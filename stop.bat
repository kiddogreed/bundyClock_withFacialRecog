@echo off
setlocal EnableDelayedExpansion

echo =========================================
echo   BundyClock - Stopping All Services
echo =========================================
echo.

:: ── 0. Kill all cmd windows that carry the BUNDYCLOCK_SVC marker ─────────
echo [1/4] Closing BundyClock terminal windows...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*BUNDYCLOCK_SVC*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

:: ── 1-3. Port-based kill via PowerShell (accurate LOCAL port match only) ──
echo [2/4] Stopping Backend (port 8080)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo [3/4] Stopping Face Recognition Service (port 5001)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo [4/4] Stopping Frontend (port 5173)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo.
echo =========================================
echo   All BundyClock services stopped.
echo =========================================
echo.
:: Clean up start.bat lock file in case it was left behind
del "%TEMP%\bundyclock_start.lock" >nul 2>&1
pause
