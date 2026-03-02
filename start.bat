@echo off
setlocal EnableDelayedExpansion

:: ── Mutex: prevent multiple simultaneous instances ────────────────────────
set "_lockfile=%TEMP%\bundyclock_start.lock"
if exist "%_lockfile%" (
    echo [WARN] start.bat is already running. Aborting duplicate launch.
    echo        If this is wrong, delete: %_lockfile%
    pause
    exit /b 1
)
echo %TIME% > "%_lockfile%"

echo =========================================
echo   BundyClock - Starting All Services
echo =========================================
echo.

:: ── 1. Kill any existing BundyClock service windows and port processes ─────
echo [Cleanup] Closing any existing BundyClock service windows...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*BUNDYCLOCK_SVC*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo [Cleanup] Releasing ports 8080, 5001, 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak >nul
echo.

:: ── 2. Launch all three services ────────────────────────────────────────
echo [1/3] Launching Backend (Spring Boot - port 8080)...
start "BundyClock Backend" cmd /k "set BUNDYCLOCK_SVC=backend && title BundyClock Backend && cd /d %~dp0backend && gradlew.bat bootRun"

echo [2/3] Launching Face Recognition Service (Python - port 5001)...
start "BundyClock Face Service" cmd /k "set BUNDYCLOCK_SVC=face && title BundyClock Face Service && cd /d %~dp0face-recognition-service && (if exist .venv\Scripts\activate.bat call .venv\Scripts\activate.bat) && python run.py"

echo [3/3] Launching Frontend (Vite - port 5173)...
start "BundyClock Frontend" cmd /k "set BUNDYCLOCK_SVC=frontend && title BundyClock Frontend && cd /d %~dp0frontend && npm run dev"

echo.
echo [Waiting] Services are starting up, performing health checks...
echo          (Backend may take up to 60s on first run)
echo.

:: ── 3. Health-check helper — polls a URL until it responds ────────────────
goto :start_checks

:wait_for_url
set "_url=%~1"
set "_label=%~2"
set /a _max=%~3
set /a _waited=0
:poll_loop
curl -s -o nul -w "%%{http_code}" --max-time 3 "%_url%" >"%TEMP%\hc_status.txt" 2>nul
set /p _code=<"%TEMP%\hc_status.txt"
if "!_code!"=="200" (
    echo   [OK] %_label% is UP  ^(took ~!_waited!s^)
    exit /b 0
)
if !_waited! GEQ !_max! (
    echo   [!!] %_label% did NOT respond after !_max!s  -- check its terminal window
    exit /b 1
)
timeout /t 3 /nobreak >nul
set /a _waited+=3
goto poll_loop

:start_checks
call :wait_for_url "http://localhost:8080/actuator/health" "Backend        (port 8080)" 90
call :wait_for_url "http://localhost:5001/health"          "Face Service   (port 5001)" 60
call :wait_for_url "http://localhost:5173"                 "Frontend       (port 5173)" 30

:: ── 4. Final summary ──────────────────────────────────────────────────────
echo.
echo =========================================
echo   BundyClock is ready!
echo.
echo   Frontend:     http://localhost:5173
echo   Backend API:  http://localhost:8080
echo   Swagger UI:   http://localhost:8080/swagger-ui.html
echo   Face Service: http://localhost:5001
echo   Face Docs:    http://localhost:5001/docs
echo =========================================
echo.
echo Opening browser...
start "" "http://localhost:5173"
echo.
echo Run stop.bat to shut everything down.
echo.
del "%_lockfile%" >nul 2>&1
pause
