#!/bin/bash

# BundyClock - Start All Services
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  BundyClock - Starting All Services${NC}"
echo -e "${CYAN}=========================================${NC}"
echo

# Store PIDs for cleanup
PIDS=()

cleanup() {
    echo
    echo -e "${YELLOW}Shutting down all services...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
        fi
    done
    # Kill any child processes
    kill -- -$$ 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1. Backend
echo -e "${GREEN}[1/3] Starting Backend (Spring Boot - port 8080)...${NC}"
cd "$SCRIPT_DIR/backend"
./gradlew bootRun &
PIDS+=($!)

# 2. Face Recognition Service
echo -e "${GREEN}[2/3] Starting Face Recognition Service (Python - port 5001)...${NC}"
cd "$SCRIPT_DIR/face-recognition-service"
python run.py &
PIDS+=($!)

# 3. Frontend
echo -e "${GREEN}[3/3] Starting Frontend (Vite - port 5173)...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev &
PIDS+=($!)

echo
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  All services are starting up!${NC}"
echo -e "${CYAN}  Backend:      http://localhost:8080${NC}"
echo -e "${CYAN}  Face Service: http://localhost:5001${NC}"
echo -e "${CYAN}  Frontend:     http://localhost:5173${NC}"
echo -e "${CYAN}=========================================${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo

# Wait for all background processes
wait
