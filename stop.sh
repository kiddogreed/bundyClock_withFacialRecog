#!/bin/bash

# BundyClock - Stop All Services

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  BundyClock - Stopping All Services${NC}"
echo -e "${CYAN}=========================================${NC}"
echo

kill_port() {
    local port=$1
    local name=$2
    local pids
    if command -v lsof &>/dev/null; then
        pids=$(lsof -ti tcp:"$port" 2>/dev/null)
    else
        pids=$(netstat -aon 2>/dev/null | grep ":${port} " | awk '{print $5}' | sort -u)
    fi

    if [[ -n "$pids" ]]; then
        echo "$pids" | xargs kill -9 2>/dev/null
        echo -e "${GREEN}  ✔ Stopped $name (port $port, PID(s): $pids)${NC}"
    else
        echo -e "  – $name (port $port) was not running"
    fi
}

echo "[1/3] Stopping Backend (port 8080)..."
kill_port 8080 "Backend"

echo "[2/3] Stopping Face Recognition Service (port 5001)..."
kill_port 5001 "Face Service"

echo "[3/3] Stopping Frontend (port 5173)..."
kill_port 5173 "Frontend"

echo
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  All BundyClock services stopped.${NC}"
echo -e "${CYAN}=========================================${NC}"
