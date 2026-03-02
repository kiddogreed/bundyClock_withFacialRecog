@echo off
echo =========================================
echo   BundyClock - Starting All Services
echo =========================================
echo.

echo [1/3] Starting Backend (Spring Boot - port 8080)...
start "BundyClock Backend" cmd /k "cd /d %~dp0backend && gradlew.bat bootRun"

echo [2/3] Starting Face Recognition Service (Python - port 5001)...
start "BundyClock Face Service" cmd /k "cd /d %~dp0face-recognition-service && python run.py"

echo [3/3] Starting Frontend (Vite - port 5173)...
start "BundyClock Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =========================================
echo   All services are starting up!
echo   Backend:      http://localhost:8080
echo   Face Service: http://localhost:5001
echo   Frontend:     http://localhost:5173
echo =========================================
echo.
echo Close individual terminal windows to stop services.
pause
