#!/usr/bin/env bash
# =============================================================
# BundyClock — Project Bootstrap Script (Git Bash / Linux / macOS)
# Run from the project root: bash setup.sh
# =============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }
step()  { echo -e "\n${GREEN}========================================${NC}"; echo -e "${GREEN}  $*${NC}"; echo -e "${GREEN}========================================${NC}"; }

# -------------------------------------------------------
# 0. Checks
# -------------------------------------------------------
step "Checking prerequisites..."

check_cmd() {
  if command -v "$1" &>/dev/null; then
    info "$1 found: $(command -v "$1")"
    return 0
  else
    return 1
  fi
}

# Java
if check_cmd java; then
  JAVA_VER=$(java -version 2>&1 | head -1)
  info "Java: $JAVA_VER"
else
  error "Java not found. Install JDK 23 from https://adoptium.net and add it to PATH."
  exit 1
fi

# Python — try common names
PYTHON_CMD=""
for cmd in python python3 py; do
  if command -v "$cmd" &>/dev/null; then
    PY_VER=$("$cmd" --version 2>&1)
    info "Python found as '$cmd': $PY_VER"
    PYTHON_CMD="$cmd"
    break
  fi
done
if [ -z "$PYTHON_CMD" ]; then
  error "Python not found. Install Python 3.10–3.12 and add it to PATH."
  exit 1
fi

# Node.js
if check_cmd node; then
  info "Node: $(node --version)"
else
  error "Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# npm
if ! check_cmd npm; then
  error "npm not found."
  exit 1
fi

# -------------------------------------------------------
# 1. Gradle Wrapper Bootstrap
# -------------------------------------------------------
step "Setting up Gradle wrapper..."

BACKEND_DIR="$SCRIPT_DIR/backend"
WRAPPER_JAR="$BACKEND_DIR/gradle/wrapper/gradle-wrapper.jar"

if [ -f "$WRAPPER_JAR" ]; then
  info "Gradle wrapper JAR already exists — skipping."
else
  if check_cmd gradle; then
    info "Bootstrapping wrapper via 'gradle wrapper'..."
    (cd "$BACKEND_DIR" && gradle wrapper --gradle-version 8.12 --distribution-type bin)
    info "Gradle wrapper generated."
  else
    warn "Gradle not installed globally. Attempting to download gradle-wrapper.jar directly..."
    mkdir -p "$BACKEND_DIR/gradle/wrapper"
    WRAPPER_JAR_URL="https://raw.githubusercontent.com/gradle/gradle/v8.12.0/gradle/wrapper/gradle-wrapper.jar"
    if check_cmd curl; then
      curl -fsSL "$WRAPPER_JAR_URL" -o "$WRAPPER_JAR"
      info "Downloaded gradle-wrapper.jar"
    elif check_cmd wget; then
      wget -q "$WRAPPER_JAR_URL" -O "$WRAPPER_JAR"
      info "Downloaded gradle-wrapper.jar"
    else
      error "Cannot download gradle-wrapper.jar: neither curl nor wget found."
      error "Install Gradle (https://gradle.org/install/) then re-run this script."
      error "  scoop install gradle          (Scoop)"
      error "  choco install gradle          (Chocolatey)"
      exit 1
    fi
  fi
fi

# Make gradlew executable (needed on Git Bash / Linux / macOS)
chmod +x "$BACKEND_DIR/gradlew"
info "gradlew is executable."

# -------------------------------------------------------
# 2. Python Virtual Environment
# -------------------------------------------------------
step "Setting up Python virtual environment for face-recognition-service..."

FACE_DIR="$SCRIPT_DIR/face-recognition-service"

if [ ! -d "$FACE_DIR/.venv" ]; then
  info "Creating .venv..."
  (cd "$FACE_DIR" && "$PYTHON_CMD" -m venv .venv)
  info ".venv created."
else
  info ".venv already exists — skipping creation."
fi

# Determine python executable inside the venv
VENV_PYTHON="$FACE_DIR/.venv/Scripts/python"   # Windows Git Bash
if [ ! -f "$VENV_PYTHON" ] && [ ! -f "${VENV_PYTHON}.exe" ]; then
  VENV_PYTHON="$FACE_DIR/.venv/bin/python"      # Linux / macOS
fi

info "Upgrading pip inside venv..."
"$VENV_PYTHON" -m pip install --upgrade pip -q || true   # ignore self-upgrade warning on Windows

info "Installing Python dependencies..."
"$VENV_PYTHON" -m pip install -r "$FACE_DIR/requirements.txt"
info "Python dependencies installed."

# Copy .env if not present
if [ ! -f "$FACE_DIR/.env" ]; then
  cp "$FACE_DIR/.env.example" "$FACE_DIR/.env"
  info "Copied .env.example → .env"
fi

# Ensure data directories exist
mkdir -p "$FACE_DIR/data/faces" "$FACE_DIR/data/embeddings"
info "Face data directories ready."

# -------------------------------------------------------
# 3. Frontend npm install
# -------------------------------------------------------
step "Installing frontend dependencies..."
FRONTEND_DIR="$SCRIPT_DIR/frontend"
(cd "$FRONTEND_DIR" && npm install)
info "Frontend dependencies installed."

# -------------------------------------------------------
# Done
# -------------------------------------------------------
step "Setup complete! Start the services:"
echo ""
echo -e "  ${YELLOW}Terminal 1 — Backend:${NC}"
echo "    cd backend"
echo "    ./gradlew bootRun --args='--spring.profiles.active=dev'"
echo ""
echo -e "  ${YELLOW}Terminal 2 — Frontend:${NC}"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo -e "  ${YELLOW}Terminal 3 — Face Recognition Service:${NC}"
echo "    cd face-recognition-service"
echo "    source .venv/Scripts/activate   # Git Bash on Windows"
echo "    # OR: source .venv/bin/activate  # Linux / macOS"
echo "    python run.py"
echo ""
echo -e "  ${GREEN}URLs:${NC}"
echo "    React App    → http://localhost:5173"
echo "    Spring Boot  → http://localhost:8080"
echo "    Swagger UI   → http://localhost:8080/swagger-ui.html"
echo "    Face Service → http://localhost:5001/docs"
echo ""
