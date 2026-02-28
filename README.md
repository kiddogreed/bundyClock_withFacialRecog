# BundyClock — Time Attendance Web App System

A full-stack time in/out attendance system with face recognition, built as a modular monorepo.

---

## System Architecture

```mermaid
graph TD
    Browser["🖥️ React Frontend<br/>localhost:5173"]
    Backend["☕ Spring Boot API<br/>localhost:8080"]
    FaceService["🐍 Face Recognition<br/>FastAPI · localhost:5001"]
    DB["🐘 PostgreSQL<br/>localhost:5432"]

    Browser --> |HTTP/REST| Backend
    Backend --> |JPA/Flyway| DB
    Backend --> |HTTP multipart| FaceService
    FaceService --> |DeepFace embeddings| FaceStorage["📁 ./data/embeddings"]
```

---

## Folder Structure

```
bundyclock/
├── backend/                         ← Spring Boot (Java 23, Gradle KTS)
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── src/
│       ├── main/
│       │   ├── java/com/bundyclock/
│       │   │   ├── BundyClockApplication.java
│       │   │   ├── auth/
│       │   │   │   └── AuthController.java
│       │   │   ├── config/
│       │   │   │   ├── AppConfig.java          ← RestTemplate bean
│       │   │   │   ├── CorsConfig.java
│       │   │   │   ├── OpenApiConfig.java
│       │   │   │   └── SecurityConfig.java
│       │   │   ├── common/
│       │   │   │   ├── dto/
│       │   │   │   │   └── ApiResponse.java
│       │   │   │   └── exception/
│       │   │   │       ├── GlobalExceptionHandler.java
│       │   │   │       └── ResourceNotFoundException.java
│       │   │   └── domain/
│       │   │       ├── employee/
│       │   │       │   ├── Employee.java
│       │   │       │   ├── EmployeeController.java
│       │   │       │   ├── EmployeeRepository.java
│       │   │       │   ├── EmployeeService.java
│       │   │       │   └── EmployeeServiceImpl.java
│       │   │       ├── attendance/
│       │   │       │   ├── AttendanceLog.java
│       │   │       │   ├── AttendanceController.java
│       │   │       │   ├── AttendanceLogRepository.java
│       │   │       │   ├── AttendanceService.java
│       │   │       │   └── AttendanceServiceImpl.java ← duplicate guard
│       │   │       └── face/
│       │   │           ├── FaceEmbedding.java
│       │   │           ├── FaceController.java
│       │   │           ├── FaceEmbeddingRepository.java
│       │   │           ├── FaceService.java
│       │   │           ├── FaceServiceImpl.java        ← real HTTP calls
│       │   │           └── FaceVerifyResult.java
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       └── db/migration/
│       │           └── V1__create_initial_tables.sql
│       └── test/
│           ├── java/.../BundyClockApplicationTests.java
│           └── resources/application.yml               ← H2 + app props
│
├── frontend/                        ← React + Vite + MUI
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── context/
│       │   └── AppContext.jsx
│       ├── api/
│       │   ├── axiosClient.js      ← 15s default / 120s for face calls
│       │   ├── auth.js
│       │   ├── employees.js
│       │   ├── attendance.js
│       │   └── face.js
│       ├── components/
│       │   ├── WebcamCapture.jsx   ← autoCapture countdown mode
│       │   ├── EmployeeCard.jsx    ← Register Face button
│       │   └── NavigationBar.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── EmployeeList.jsx
│           ├── EmployeeRegistration.jsx
│           ├── BundyClock.jsx          ← auto face scan (no manual capture)
│           ├── FaceRegistration.jsx    ← new: register faces per employee
│           └── AttendanceLogs.jsx
│
├── face-recognition-service/        ← Python FastAPI + DeepFace
│   ├── run.py
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── routers/
│   │   │   └── face.py
│   │   ├── schemas/
│   │   │   └── face_schemas.py
│   │   └── services/
│   │       └── face_service.py     ← multi-embedding accumulation
│   ├── data/
│   │   ├── faces/           ← raw face images
│   │   └── embeddings/      ← JSON embedding vectors (one file per employee)
│   └── tests/
│       └── test_face_router.py
│
└── bundyclock-postman-collection.json
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Java JDK | 23 | [Adoptium](https://adoptium.net) or [Oracle](https://oracle.com/java) |
| Gradle | 8.x | Bundled via wrapper (`./gradlew`) |
| PostgreSQL | 15+ | [psql](https://www.postgresql.org/download/windows/) |
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| Python | 3.10 – 3.12 | [python.org](https://python.org) |
| Git Bash | Any | Recommended terminal on Windows |

---

## 1 · Database Setup

```sql
-- Run once in psql or pgAdmin
CREATE DATABASE bundyclock_db;
CREATE DATABASE bundyclock_dev;
```

---

## 2 · Backend (Spring Boot)

```bash
cd backend

# Git Bash (Windows) / macOS / Linux
./gradlew bootRun --args='--spring.profiles.active=dev'
```

- API base URL: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- Flyway runs automatically and creates all tables on first start.

**Edit `src/main/resources/application.yml`** to adjust the DB credentials if needed.

---

## 3 · Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- App URL: http://localhost:5173
- Vite proxies `/api` → `http://localhost:8080`

---

## 4 · Face Recognition Service (Python FastAPI)

```bash
cd face-recognition-service

# Create a virtual environment (first time only)
python -m venv .venv

# Activate — Git Bash / macOS / Linux
source .venv/Scripts/activate   # Git Bash on Windows
source .venv/bin/activate        # macOS / Linux

# Install dependencies (first time only)
pip install -r requirements.txt

# Start service
python run.py
```

- Service URL: http://localhost:5001
- API Docs: http://localhost:5001/docs
- Health check: http://localhost:5001/health

> **Note:** First launch downloads the VGG-Face model weights (~580 MB) to `~/.deepface/weights/`. Subsequent starts are fast.

> **Dependency note:** TensorFlow 2.20+ requires the `tf-keras` package. It is included in `requirements.txt`.

---

## 5 · Running Everything Together (Git Bash)

Open **three separate terminals** and run:

```bash
# Terminal 1 — Backend
cd /c/projects/2026/bundyclock/backend
./gradlew bootRun --args='--spring.profiles.active=dev'

# Terminal 2 — Frontend
cd /c/projects/2026/bundyclock/frontend
npm install && npm run dev

# Terminal 3 — Face Recognition Service
cd /c/projects/2026/bundyclock/face-recognition-service
source .venv/Scripts/activate
python run.py
```

### Stopping & restarting (Git Bash)

```bash
# Kill processes on all service ports
for port in 8080 5001 5173; do
  PID=$(netstat -ano | grep "LISTENING" | grep ":${port} " | awk '{print $NF}' | head -1)
  [ -n "$PID" ] && taskkill.exe //F //PID $PID
done
```

---

## 6 · Unit Testing (Backend)

### Overview

The backend uses **JUnit 5** + **MockMvc** (`@WebMvcTest`) for controller-layer tests.
Each controller is tested in isolation — the service layer is replaced with a **Mockito** mock, so no database or external services are required.

| Test class | Controller under test | # tests |
|---|---|---|
| `EmployeeControllerTest` | `GET/POST/PUT/DELETE /api/employees` | 9 |
| `AttendanceControllerTest` | `POST time-in/out`, `GET /api/attendance` | 8 |
| `FaceControllerTest` | `POST /api/face/verify` + `/register` | 6 |
| `AuthControllerTest` | `POST /api/auth/login` | 3 |

### Test design

- `@WebMvcTest` — loads only the web layer (controller + security + exception handler). No JPA or real beans.
- `@Import(SecurityConfig.class)` — loads the project's own `SecurityConfig` so CSRF is disabled and all requests are permitted (matching production behaviour).
- `@WithMockUser` — satisfies Spring Security's requirement for an authenticated principal during tests.
- `@MockBean` — replaces the service interface with a Mockito mock. `when(…)` stubs define the response per test.
- `MockMultipartFile` — simulates multipart/form-data file uploads without touching the file system.
- Error paths (404, 409, 500) are covered by stubbing the mock to throw the appropriate exception, which the `GlobalExceptionHandler` translates.

### Running the tests

```bash
cd backend

# Run all tests (unit + integration)
./gradlew test

# Run only the four controller unit tests
./gradlew test \
  --tests "com.bundyclock.domain.employee.EmployeeControllerTest" \
  --tests "com.bundyclock.domain.attendance.AttendanceControllerTest" \
  --tests "com.bundyclock.domain.face.FaceControllerTest" \
  --tests "com.bundyclock.auth.AuthControllerTest"

# Run a single nested test class
./gradlew test --tests "com.bundyclock.domain.employee.EmployeeControllerTest\$GetAllEmployees"

# Run with verbose output
./gradlew test --info

# Run and always re-execute (skip up-to-date checks)
./gradlew cleanTest test
```

### Viewing test reports

After `./gradlew test`, open the HTML report in your browser:

```
backend/build/reports/tests/test/index.html
```

Or on Windows Git Bash:

```bash
start build/reports/tests/test/index.html
```

### Test application config (`src/test/resources/application.yml`)

Tests use an **in-memory H2** database — no PostgreSQL connection is required:

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    database-platform: org.hibernate.dialect.H2Dialect
  flyway:
    enabled: false   # schema created by Hibernate in test mode
```

### Adding new controller tests

1. Create a file under `src/test/java/com/bundyclock/<package>/<ControllerName>Test.java`
2. Annotate the class:
   ```java
   @WebMvcTest(YourController.class)
   @Import(SecurityConfig.class)
   @WithMockUser
   class YourControllerTest {
       @Autowired MockMvc mockMvc;
       @MockBean  YourService yourService;
       // ...
   }
   ```
3. Use `@Nested` + `@DisplayName` to group tests by endpoint.
4. Use `mockMvc.perform(...)` + `.andExpect(...)` to assert status codes and JSON body.
5. Run with `./gradlew test --tests "com.bundyclock.<package>.YourControllerTest"`.

---

## 7 · Face Registration Workflow

Before employees can use the BundyClock, their face must be registered:

1. Go to **Employees** → find the employee → click **Register Face**
2. The webcam opens with a **3-second countdown** — position the employee's face in the frame
3. The photo is automatically captured and sent to the face service
4. Register **2–5 photos** from slightly different angles for best accuracy
5. Each photo is accumulated (not overwritten) — all registered embeddings are used during verification

---

## 8 · BundyClock Face Scan Workflow

1. Go to **BundyClock** and select **Time In** or **Time Out**
2. Position your face in the frame — a **3-second countdown** fires the auto-capture
3. The system verifies the face against all registered embeddings
4. On success: attendance is automatically recorded
5. On error: the message is shown for 3 seconds then the countdown restarts

### Business Rules enforced by the backend

| Condition | Result |
|-----------|--------|
| Employee already timed in today and tries to time in again | `409` — "Already timed in today. Please time out first." |
| Employee tries to time out with no time-in record today | `409` — "Cannot time out — no time-in record found for today." |
| Employee already timed out today and tries again | `409` — "Already timed out today." |

---

## 9 · Postman Collection

Import `bundyclock-postman-collection.json` in Postman.

Set collection variables:
| Variable | Value |
|----------|-------|
| `base_url` | `http://localhost:8080` |
| `face_url` | `http://localhost:5001` |
| `token` | *(auto-populated on login)* |
| `employee_id` | *(paste a real UUID after creating an employee)* |

---

## 10 · API Endpoints Summary

### Spring Boot (`:8080`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login (returns JWT stub) |
| `GET` | `/api/employees` | List all employees |
| `POST` | `/api/employees` | Create employee |
| `GET` | `/api/employees/{id}` | Get employee by ID |
| `PUT` | `/api/employees/{id}` | Update employee |
| `DELETE`| `/api/employees/{id}` | Delete employee |
| `POST` | `/api/attendance/time-in` | Record Time-In (with duplicate guard) |
| `POST` | `/api/attendance/time-out` | Record Time-Out (with duplicate guard) |
| `GET` | `/api/attendance` | All attendance logs |
| `GET` | `/api/attendance/employee/{id}` | Logs for one employee |
| `POST` | `/api/face/verify` | Verify face (proxies to face-svc) |
| `POST` | `/api/face/register` | Register face (proxies to face-svc) |

### Face Recognition Service (`:5001`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/verify-face` | Verify face image against all stored embeddings |
| `POST` | `/register-face` | Register/accumulate face embedding for employee |
| `GET` | `/health` | Health check |

---

## 11 · Data Model Overview

```
┌──────────────┐        ┌───────────────────┐       ┌────────────────────┐
│   employees  │        │  attendance_logs  │       │  face_embeddings   │
├──────────────┤        ├───────────────────┤       ├────────────────────┤
│ id (UUID PK) │◄─┐     │ id (UUID PK)      │       │ id (UUID PK)       │
│ name         │  └────►│ employee_id (FK)  │  ┌───►│ employee_id (FK)   │
│ employee_code│        │ timestamp         │  │    │ raw_image_path     │
│ department   │        │ type (IN/OUT)     │  │    │ model_used         │
│ email        │        │ image_path        │  │    │ created_at         │
│ created_at   │  ┌────►│ confidence_score  │  └────┤                    │
│ updated_at   │  │     │ verified          │       └────────────────────┘
└──────────────┘  │     │ notes             │
                  │     └───────────────────┘
                  │
           (same FK pattern)

Embeddings on disk (face-recognition-service/data/embeddings/):
  {employee_id}.json → { "employee_id": "...", "embeddings": [[...], [...]] }
  Multiple photos per employee are accumulated — not overwritten.
```

---

## 12 · Production Hardening Notes

### Security
- [ ] Replace placeholder JWT with real Spring Security JWT filter chain (`jjwt` or `nimbus-jose-jwt`)
- [ ] Add role-based access control (`ADMIN`, `EMPLOYEE`, `KIOSK` roles)
- [ ] Enable HTTPS (TLS) with Let's Encrypt or a reverse proxy (nginx/caddy)
- [ ] Secrets management via AWS Secrets Manager, Azure Key Vault, or Vault by HashiCorp
- [ ] Rate-limit `/api/auth/login` with `bucket4j` or nginx

### Database
- [ ] Consider `pgvector` extension for storing face embedding vectors natively with similarity search
- [ ] Add DB connection pooling (HikariCP — already included by Spring Boot)
- [ ] Set up read replicas for attendance log queries

### Face Recognition
- [ ] Switch to `ArcFace` model (more accurate than VGG-Face) in production
- [ ] Use `retinaface` detector for better face detection in varied lighting
- [ ] Implement liveness detection (anti-spoofing) to prevent photo attacks
- [ ] Store embeddings in PostgreSQL `pgvector` instead of flat JSON files
- [ ] Add confidence threshold tuning per environment

### Frontend
- [ ] Add React Query or SWR for server state management and caching
- [ ] Implement proper error boundaries
- [ ] Add PWA manifest for kiosk deployment
- [ ] Consider migrating to TypeScript

### Infrastructure
- [ ] Dockerize all three services (Dockerfile + docker-compose.yml)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add structured logging (Logback JSON appender → ELK / Loki)
- [ ] Implement distributed tracing (OpenTelemetry)

---

## 13 · Known MVP Limitations

1. JWT authentication returns a **stub token** — not validated by the backend.
2. Image storage is **local filesystem** — will not work in stateless/containerised environments without a volume or object store.
3. No pagination on list endpoints.
4. Face embeddings comparison is O(n × k) linear scan — use `pgvector` for scale.
5. DeepFace model weights (~580 MB) are downloaded on first run; ensure internet access on first start.
