# BundyClock — Future Phase Improvement Plan

> Generated: February 25, 2026  
> Based on current MVP implementation

---

## Current State Summary

The MVP delivers:
- JWT stub authentication (not validated by backend)
- Employee CRUD with face registration
- Face recognition via DeepFace (VGG-Face + cosine similarity over flat JSON files)
- Time-In / Time-Out with duplicate guard (per-day business rule)
- Attendance log viewer with type/date filters
- Three-service architecture: Spring Boot · React/Vite · FastAPI/DeepFace

---

## Phase 2 — Security & Real Authentication

> **Priority: High — must be done before any production exposure**

### Backend
- [ ] Replace stub JWT in `AuthController` with real Spring Security JWT filter chain (`jjwt` or `nimbus-jose-jwt`)
- [ ] Add role-based access control — `ADMIN`, `HR`, `KIOSK` roles with method-level `@PreAuthorize`
- [ ] Implement refresh tokens so sessions don't expire mid-shift
- [ ] Rate-limit `POST /api/auth/login` with `bucket4j` to prevent brute-force attacks
- [ ] Move DB credentials out of `application.yml` into environment variables or a secrets manager (AWS Secrets Manager / Azure Key Vault / HashiCorp Vault)
- [ ] Enable Spring Security password encoding (`BCryptPasswordEncoder`) for stored credentials
- [ ] Create a `users` table and decouple auth users from employee records

### Frontend
- [ ] Store JWT in `httpOnly` cookie instead of `localStorage` (XSS protection)
- [ ] Add token expiry detection and silent refresh logic in `axiosClient.js`
- [ ] Show role-based navigation (hide admin-only routes from KIOSK role)

---

## Phase 3 — Face Recognition Accuracy & Robustness

> **Priority: High — core functionality improvement**

### Model & Detection
- [ ] Switch `DEEPFACE_MODEL` from `VGG-Face` → **ArcFace** (more accurate, especially for Asian faces)
- [ ] Use `retinaface` as the detector backend (replace `opencv`) for better detection under varied lighting
- [ ] Make model and detector configurable per environment via `.env`

### Anti-Spoofing
- [ ] Implement **liveness detection** — currently a printed photo or screen image can trick the system
- [ ] Consider integrating a dedicated anti-spoofing model (e.g., Silent-Face Anti-Spoofing)

### Embedding Storage
- [ ] Migrate face embeddings from flat `.json` files → **PostgreSQL `pgvector`** extension
- [ ] Enable indexed ANN (approximate nearest-neighbor) search — current O(n×k) linear scan doesn't scale
- [ ] Track model version per embedding row (column exists: `model_used`) to support re-generation on model upgrades
- [ ] Add embedding deletion and re-registration workflow for employees

### Confidence Tuning
- [ ] Make `CONFIDENCE_THRESHOLD` configurable per employee or department
- [ ] Log per-employee confidence trends to detect face-data degradation over time

---

## Phase 4 — Attendance Business Logic

> **Priority: Medium**

### Extended Punch Types
- [ ] Add `BREAK_START` / `BREAK_END` as new `AttendanceType` values for lunch/break tracking
- [ ] Add `OVERTIME_START` / `OVERTIME_END` types

### Computed Fields
- [ ] Calculate and store `total_hours_worked` per day when employee times out
- [ ] Store `late_minutes` based on a configurable shift start time

### Shift Scheduling
- [ ] Create `shifts` table: `shift_name`, `start_time`, `end_time`, `grace_period_minutes`
- [ ] Link employees to shifts via `employee_shifts` junction table
- [ ] Enforce late/absent flagging on `timeIn()` based on assigned shift

### Reporting Endpoints
- [ ] Expose the existing `findByTimestampBetween` repository method via a `GET /api/attendance?from=&to=&employeeId=` controller endpoint (already implemented in repo, not exposed)
- [ ] `GET /api/attendance/summary/daily?date=` — headcount, lates, absents
- [ ] `GET /api/attendance/summary/monthly?employeeId=&month=` — total hours, late count, absent count

### Timezone
- [ ] Make site timezone configurable (`app.timezone` property) instead of `ZoneId.systemDefault()`

---

## Phase 5 — Reporting & Dashboard

> **Priority: Medium**

### Backend
- [ ] Daily/weekly/monthly attendance summary endpoint
- [ ] Export to **CSV** for payroll — `GET /api/attendance/export?from=&to=&format=csv`
- [ ] Export to **Excel** (Apache POI) — `GET /api/attendance/export?format=xlsx`

### Frontend
- [ ] Admin **Dashboard** page:
  - Headcount present today
  - Late arrivals list
  - Absent employees (those with no TIME_IN today)
  - Recent activity feed
- [ ] Per-employee **Attendance History** page with monthly calendar heatmap
- [ ] Department-level attendance overview

---

## Phase 6 — Employee Management Enhancements

> **Priority: Medium**

### Employee Profile
- [ ] **Employee profile photo** (separate from face embeddings) — stored in object storage
- [ ] **Position/designation** field (currently only `department`)
- [ ] **Employee status** — `ACTIVE`, `RESIGNED`, `ON_LEAVE` — prevent inactive employees from clocking in
- [ ] **Date hired** / **Date resigned** fields

### Shift Assignment
- [ ] UI for assigning shifts to employees
- [ ] Bulk shift assignment by department

### List Improvements
- [ ] Add **pagination** to `GET /api/employees` (noted in `TODO` in `EmployeeServiceImpl`)
- [ ] Add server-side search by name, code, department
- [ ] Add sort options (by name, department, date hired)

### Employee View Page
- [ ] The `/employees/:id` route exists in `App.jsx` but has no destination page — build an `EmployeeDetail.jsx` showing profile, face status, and recent attendance

---

## Phase 7 — Infrastructure & DevOps

> **Priority: Medium — required before containerized / cloud deployment**

### Dockerization
- [ ] `Dockerfile` for Spring Boot backend
- [ ] `Dockerfile` for FastAPI face-recognition service
- [ ] `Dockerfile` (nginx) for React frontend
- [ ] Root `docker-compose.yml` spinning up all four services (backend, frontend, face-svc, postgres)
- [ ] `docker-compose.override.yml` for dev (volume mounts, hot reload)

### CI/CD
- [ ] GitHub Actions workflow: build + test on push to `main`
- [ ] Separate workflow for Docker image build + push to registry
- [ ] Automated Flyway migration validation in CI

### Backend Improvements
- [ ] Replace `RestTemplate` in `FaceServiceImpl` with **`WebClient`** (non-blocking) — DeepFace calls can take 30–90s and block a thread
- [ ] Add `spring-boot-starter-actuator` health indicators for the face service dependency
- [ ] Expose `GET /api/face/health` proxy endpoint so the frontend can show face-service status

### Image Storage
- [ ] Move captured face images from local `./uploads/faces` → AWS S3 / Azure Blob Storage
- [ ] Store image URLs in `attendance_logs.image_path` instead of local paths
- [ ] Serve images through a signed URL to prevent direct public access

### Observability
- [ ] Structured JSON logging via Logback → ship to Loki or ELK
- [ ] Distributed tracing with **OpenTelemetry** (Spring Boot auto-instrumentation)
- [ ] Prometheus metrics endpoint (`/actuator/prometheus`) + Grafana dashboard

---

## Phase 8 — Frontend Quality & UX

> **Priority: Low-Medium**

- [ ] Migrate from JavaScript to **TypeScript** across all frontend files
- [ ] Add **React Query** (or SWR) for server state management, caching, and background refetch
- [ ] Implement proper **React error boundaries**
- [ ] Add **PWA manifest** + service worker for kiosk offline support
- [ ] Dark mode support
- [ ] Mobile-responsive layout for tablet kiosk deployment
- [ ] Keyboard navigation and WCAG 2.1 accessibility audit

---

## Quick Wins — Can Be Done Now

| Item | File(s) | Effort |
|---|---|---|
| Real JWT auth | `AuthController.java`, `SecurityConfig.java` | Medium |
| Expose date-range attendance query | `AttendanceController.java` | Small |
| Add pagination to employee list | `EmployeeServiceImpl.java`, `EmployeeList.jsx` | Small |
| `WebClient` replacing `RestTemplate` | `FaceServiceImpl.java`, `AppConfig.java` | Small |
| Employee detail page | New `EmployeeDetail.jsx` | Small |
| `pgvector` for embeddings | New Flyway migration + `face_service.py` | Medium |
| Employee `status` field | New Flyway migration + `Employee.java` | Small |
| Add `/api/attendance` date-range params | `AttendanceController.java` | Small |

---

## Known MVP Limitations (for reference)

1. JWT authentication returns a **stub token** — not validated by the backend
2. Image storage is **local filesystem** — won't work in stateless/containerized environments
3. No pagination on list endpoints
4. Face embedding comparison is **O(n × k) linear scan** — use `pgvector` for scale
5. DeepFace model weights (~580 MB) are downloaded on first run
6. `SecurityConfig` permits **all requests** — no route is protected
7. Confidence threshold is global — no per-employee tuning
