# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

> Changes staged but not yet given a version tag.

---

## [0.8.0] - 2026-03-02

### Fixed

- **BundyClock — "Face verification failed" caused by `employees.find is not a function`**
  - `GET /api/employees` returns `Page<Employee>`; the response shape is `{ content: [...], pageable: {}, totalElements: N }` not a plain array.
  - `setEmployees(res.data.data)` was storing the whole Page object so `employees.find(...)` threw a `TypeError`, caught by the outer `catch` which surfaced as the generic "Face verification failed." message.
  - Fixed: `setEmployees(res.data.data?.content ?? [])` with `getEmployees(0, 200)` to load all employees for lookup.

- **BundyClock — outer `catch` hid all real errors behind "Face verification failed."**
  - Added explicit `instanceof TypeError` guard: stops auto-capture and shows the actual JS error message with "Please refresh the page."
  - Added `console.error` with `err.message` so the real exception is always visible in DevTools even when a friendly message is shown.
  - Error message chain priority corrected: `friendlyMessage` → `ECONNABORTED` text → `response.data.message` (only when `typeof data === 'object'`) → generic fallback.

- **BundyClock — `result.employeeId` never matched a DB employee (endless "No match found")**
  - Face embeddings on disk were registered under old employee UUIDs that no longer exist in the database.
  - The FK constraint on `attendance_logs.employee_id → employees(id)` caused a `DataIntegrityViolationException` on every attendance write attempt.
  - Fixed `GlobalExceptionHandler` to recognise FK violation keywords (`foreign key`, `fkey`, `not present in table`) and return a clear message: *"The employee linked to this face scan no longer exists. Please re-register the employee's face."*

- **Spring Security — empty body on 401 / 403 masked auth errors**
  - Spring Security's default behaviour returns `HTTP 403` with **no body** when a JWT is missing or expired; `err.response.data` was an empty string, so `response.data.message` evaluated to `undefined` and the generic fallback fired.
  - Added `authenticationEntryPoint` and `accessDeniedHandler` to `SecurityConfig` using Jackson `ObjectMapper` to write a proper `ApiResponse.error(...)` JSON body (401 for missing/invalid token, 403 for insufficient permissions).

- **`axiosClient.js` — 401/403 handling incomplete**
  - Previously only `status === 401` triggered logout-redirect; `403` was silently swallowed with no message.
  - Combined 401+403 into a single handler: sets `friendlyMessage = "Your session has expired. Redirecting to login…"`, waits 1.5 s (so the message renders in-UI) then redirects.
  - Server-provided message from JSON body is used when available.
  - Added `ECONNRESET` and `ETIMEDOUT` to the unreachable-server error codes.
  - Added explicit 502/503/504 gateway handling: `"Server is not ready yet. Please wait a moment and try again."`

- **Backend → face-service HTTP calls — no timeout configured**
  - `WebClient` bean had zero timeout; on first DeepFace load (30–90 s) Spring Boot servlet threads blocked indefinitely. Under repeated auto-capture retries this exhausted the thread pool.
  - `AppConfig` now configures a Netty `HttpClient` with: connect timeout 10 s, response timeout 120 s, read timeout 120 s, write timeout 30 s.

- **Attendance API — 15 s default timeout caused false `ECONNABORTED` on cold start**
  - `timeIn` / `timeOut` in `attendance.js` inherited the default 15 s axios timeout, silently failing on JVM warm-up.
  - Added `ATTENDANCE_TIMEOUT = 60_000` (60 s) to both calls, matching the same pattern used in `face.js`.

- **BundyClock — error message precedence bug in attendance error handler**
  - `attendErr.response?.data?.message` was checked before `friendlyMessage`, meaning a server message like "Already timed in" could be shadowed by a network-layer message.
  - Fixed priority: `friendlyMessage` → `ECONNABORTED` text → `response.data.message` → generic fallback.

- **React Router v6 future-flag warnings**
  - `BrowserRouter` in `main.jsx` missing `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`, triggering console warnings on every page load.

- **`stop.bat` — infinite loop crashing Windows (required machine restart)**
  - `for /f "tokens=5" %%a in ('netstat … ^| findstr ":8080 "')` matched remote-address column entries, not just local ports, feeding wrong PIDs — including system PID `0` — to `taskkill /F`, causing cascading system process kills and a BSOD-level crash.
  - Replaced all three `for /f` + `netstat` loops with PowerShell `Get-NetTCPConnection -LocalPort <N>` which matches only the correct local-port listener; `Where-Object { $_ -gt 0 }` guards against PID 0; `Select-Object -Unique` prevents duplicate kills.

- **`start.bat` — same dangerous `netstat` loops in port-cleanup section**
  - Same root cause as `stop.bat`; replaced cleanup section with matching PowerShell `Get-NetTCPConnection` calls.

- **`start.bat` — broken `cd /d` paths in `cmd /k` launch strings**
  - Nested double-quotes inside the outer `cmd /k "…"` string caused `cd /d "%~dp0backend"` to silently fail (path truncated at the inner `"`). Services launched from the wrong working directory.
  - Removed inner quotes: `cd /d %~dp0backend` (correct — `%~dp0` always ends with `\`).

- **`start.bat` — health-check `poll_loop` used stale variable values**
  - `%_waited%` and `%_max%` inside a `goto` loop are expanded once at parse-time, not per-iteration, so the timeout counter never advanced reliably.
  - Changed to `!_waited!` / `!_max!` (delayed expansion, already enabled via `setlocal EnableDelayedExpansion`).

### Added

- **`start.bat` — mutex lock prevents duplicate launches opening unbounded cmd windows**
  - Script writes `%TEMP%\bundyclock_start.lock` on entry; aborts immediately with a warning if the lock already exists, preventing a second `start.bat` from spawning 3 duplicate service windows.
  - Lock is deleted at normal exit. `stop.bat` also deletes the lock as a recovery step if `start.bat` was force-closed mid-run.

- **`start.bat` — pre-launch `BUNDYCLOCK_SVC` window cleanup**
  - Kills any existing service windows tagged with `BUNDYCLOCK_SVC` at startup (previously only `stop.bat` did this). Re-running `start.bat` now always results in exactly 3 service windows — never stacks.

- **`GlobalExceptionHandler` — FK violation error detection**
  - Detects `foreign key` / `fkey` / `not present in table` in constraint messages and returns a user-readable explanation instead of leaking raw SQL.

### Changed

- **BundyClock — successful scan permanently switches to manual mode for the session**
  - Added `everSucceeded` state (never resets). Once any time-in or time-out is successfully recorded, `autoActive` is **never re-enabled** for the rest of the browser session.
  - `handleScanAgain` no longer calls `setAutoActive(true)` or `setDoneMode(null)` — the camera resets to idle in manual mode and the completed mode's toggle stays locked.
  - Mode toggle `onChange` respects `everSucceeded`: `setAutoActive(!everSucceeded)` — auto-capture only fires on first page load before any record is saved.

---

## [0.7.0] - 2026-03-02

### Added
- **Real JWT authentication (`backend`)**
  - `JwtService` — generates and validates HS-256 JWTs (jjwt 0.12.x); secret + expiry driven by `application.yml`.
  - `JwtAuthenticationFilter` — `OncePerRequestFilter` that extracts Bearer tokens, validates, and populates `SecurityContext`.
  - `SecurityConfig` — stateless session, BCrypt password encoder, `InMemoryUserDetailsManager` (admin/admin123 for MVP), JWT filter chain; public routes: `POST /api/auth/login`, `/uploads/**`, Swagger, actuator health.
  - `AuthController` — real login via `AuthenticationManager`; returns `{ token, role }` on success, 401 on failure.
  - Dependencies added: `jjwt-api:0.12.6`, `jjwt-impl:0.12.6` (runtimeOnly), `jjwt-jackson:0.12.6` (runtimeOnly).

- **Employee status field (`backend`)**
  - Flyway migration `V3__add_status_to_employees.sql`: `ALTER TABLE employees ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'`.
  - `Employee.java` — new `EmployeeStatus` enum (`ACTIVE`, `ON_LEAVE`, `RESIGNED`); field default `ACTIVE`; `updateEmployee` now persists status changes.

- **Pagination for employee list (`backend` + `frontend`)**
  - `GET /api/employees` now returns `Page<Employee>` with `page` (default 0) and `size` (default 20) query params; sorted by name ascending.
  - `EmployeeList.jsx` — reads `data.content`, shows MUI `Pagination` component at the bottom when `totalPages > 1`; `PAGE_SIZE = 12`.

- **Date-range attendance query (`backend` + `frontend`)**
  - `GET /api/attendance` now accepts optional `employeeId`, `from`, and `to` (ISO date-time) query params; all 4 filter combinations handled.
  - `attendance.js` — new `getLogsInRange(employeeId, from, to)` helper.

- **WebClient replacing RestTemplate (`backend`)**
  - `spring-boot-starter-webflux` added; `AppConfig` exposes a `WebClient` bean.
  - `FaceServiceImpl` migrated from `RestTemplate` to `WebClient` + `MultipartBodyBuilder`; `WebClientResponseException` handled separately.

- **Face registration status on profile page (`backend` + `frontend`)**
  - New `FaceStatusResponse` DTO: `employeeId`, `embeddingCount`, `registered`, `lastRegisteredAt`.
  - `GET /api/face/employee/{employeeId}/status` endpoint via `FaceController` → `FaceService`.
  - `face.js` — new `getFaceStatus(employeeId)` API helper.
  - `EmployeeProfile.jsx` — shows "Face Registration" section in the left card (registered chip + photo count, or "Not yet registered"); updates alongside employee data on load.

- **Auto-activate Python venv in `start.sh`**
  - Before launching `python run.py`, the script now detects `.venv/Scripts/activate` (Windows/Git Bash) or `.venv/bin/activate` (macOS/Linux) and sources it automatically.
  - Prints a clear warning with setup instructions if no `.venv` is found.

### Changed
- **All four backend controller tests** updated: `@MockBean JwtService` added to satisfy `SecurityConfig` constructor injection; `AuthControllerTest` fully rewritten for real authentication; `EmployeeControllerTest` updated for `PageImpl`; `AttendanceControllerTest` updated for `getLogs(any, any, any)`; `FaceControllerTest` gains two new face-status tests.

---

## [0.6.0] - 2026-03-02

### Added
- **One-command startup scripts — run all three services simultaneously**
  - `start.bat` — Windows batch script; launches each service in its own terminal window (`start` command) so logs are visible independently. Double-click or run from any terminal.
  - `start.sh` — Bash script for Git Bash / WSL / macOS / Linux; starts all three services as background jobs in the same shell. Pressing `Ctrl+C` triggers a `trap` that gracefully kills all child processes.
  - Both scripts start services in the correct order:
    1. Backend — `./gradlew bootRun` (port 8080)
    2. Face Recognition Service — `python run.py` (port 5001)
    3. Frontend — `npm run dev` (port 5173)
  - Service URLs are printed to the console after all three are launched.

- **README.md** — Section 5 "Running Everything Together" rewritten:
  - New **Quick Start (one command)** subsection with `start.bat` and `start.sh` usage.
  - Original three-terminal manual steps retained as a fallback reference.
  - Folder structure updated to list `start.bat` and `start.sh` at the project root.

---

## [0.5.0] - 2026-03-01

### Added
- **Full unit test coverage across all three services**
  - **Backend** — Added `UploadPhoto` nested test class to `EmployeeControllerTest` (3 new tests: success 200, 404 not-found, 400 missing file). Endpoint: `PATCH /api/employees/{id}/photo`.
  - **Frontend (Vitest + Testing Library)** — New test suite:
    - `src/api/employees.test.js` — 9 tests covering all 6 API functions; verifies multipart boundary is never manually overridden.
    - `src/components/WebcamCapture.test.jsx` — 12 tests: rendering, countdown (start / tick / stop on prop change), status-state captions, autoCapture button visibility.
    - `src/pages/BundyClock.test.jsx` — 10 tests: initial render, mode toggle, employee load, clock display.
    - Vitest + jsdom + `@testing-library/react` added to `package.json`; test config added to `vite.config.js`; `src/test/setup.js` imports `@testing-library/jest-dom`.
  - **Python (pytest)** — Upgraded from 3 basic tests to full dual-module suite:
    - `tests/test_face_router.py` — 16 tests: health, verify-face (matched / unmatched / no-embedding / non-image / exception), register-face (validation / success / no-face / exception / accumulation × 3).
    - `tests/test_face_service.py` (new) — 14 tests: `_cosine_similarity` edge cases, `register_face` (success / no-face / accumulation), `verify_face` (no-dir / no-files / match / threshold / no-face-in-query / best-of-multiple employees).

- **README.md** — Major documentation update:
  - Folder structure reflects all new files (`EmployeeProfile.jsx`, `WebMvcConfig.java`, `V2__add_photo_url_to_employees.sql`, `CHANGELOG.md`, `test_face_service.py`)
  - Section 6 "Unit Testing" now covers all three stacks (6a Backend / 6b Frontend / 6c Python) with run commands, design notes, and how-to-add-tests guides
  - Section 8 BundyClock workflow updated with camera-freeze, toggle-disable, and "Scan Again" behavior
  - Section 11 API table adds `PATCH /api/employees/{id}/photo`
  - Section 12 data model adds `photo_url` column to employees diagram

- **CHANGELOG.md** — Created this file to track all changes going forward.

---

## [0.4.0] - 2026-03-01

### Fixed
- **BundyClock — infinite scan loop on attendance error**
  - Attendance API call (Step 3) is now wrapped in its own `try/catch` independent of the face-verify `try/catch`.
  - Attendance errors (HTTP 409 already recorded, 500, timeout) now call `setAutoActive(false)`, stopping the auto-capture countdown and preventing the webcam from looping back into the same failing request.
  - Face-not-recognised errors still keep `autoActive = true` so the next person can walk up and be scanned automatically.
- **BundyClock — frozen captured image after "Scan Again"**
  - Added `scanKey` state (increments on "Scan Again" and mode switch) used as the `key` prop on `WebcamCapture`, forcing a clean remount that clears the internally stored captured image and restarts the countdown.
- **WebcamCapture — error auto-reset fires when it shouldn't**
  - Auto-reset after an error now only fires when `autoCapture = true`. When `autoCapture = false` (e.g. attendance error stopped the loop) the frozen frame stays visible and the "Scan Again" button is shown instead.
- **WebcamCapture — "Resetting in Xs…" caption shown incorrectly**
  - Caption is now gated on `autoCapture && (error || success)`, matching the actual reset behaviour.

### Changed
- `BundyClock.jsx` — "Scan Again" button is now shown on both `status === 'success'` and attendance-error states (when `autoActive = false`).

---

## [0.3.0] - 2026-03-01

### Added
- **BundyClock — disable completed toggle after successful scan**
  - Added `doneMode` state (`null | 'TIME_IN' | 'TIME_OUT'`).
  - After a successful Time In the **Time In** toggle is disabled; after Time Out the **Time Out** toggle is disabled.
  - Switching to the other mode (still enabled) resets the camera and re-enables auto-capture.
  - "Scan Again" clears `doneMode`, re-enabling both toggles.

---

## [0.2.0] - 2026-03-01

### Added
- **BundyClock — stop camera reset after successful attendance**
  - Added `autoActive` state; set to `false` on success so the webcam freezes on the captured frame.
  - Added "Scan Again" button that re-enables `autoActive` to restart the auto-capture flow.
- **FaceRegistration — stop auto-capture after first registration**
  - Auto-capture stops (`setAutoActive(false)`) immediately after a face is successfully registered.
  - Added "Capture Another" button to re-enable `autoActive` for subsequent captures.
- **FaceRegistration — auto-set profile photo on face capture**
  - After a successful face registration the captured blob is immediately uploaded as the employee's profile photo via `PATCH /api/employees/:id/photo`.
  - Employee avatar in the header card updates to the new photo.
- **WebcamCapture — stop countdown when parent disables autoCapture**
  - New `useEffect` clears the countdown to `null` whenever the `autoCapture` prop becomes `false`.

### Fixed
- **CORS — PATCH method blocked by preflight**
  - Added `"PATCH"` to `CorsConfig.java` allowed methods list.
  - Previously all photo-upload requests were silently rejected by the browser CORS preflight.
- **Employee photo upload — broken multipart boundary**
  - Removed manual `Content-Type: multipart/form-data` header from `uploadEmployeePhoto()` in `employees.js`.
  - Letting axios set the header automatically preserves the required `boundary=…` parameter.
- **FaceRegistration — profile photo not refreshing after upload**
  - `setEmployee(photoRes.data.data)` now stores the full employee object returned by the API instead of a dummy flag object.

---

## [0.1.0] - 2026-03-01

### Added
- **Employee Profile Management**
  - New `EmployeeProfile.jsx` page (`/employees/:id`) with:
    - Avatar with hover-to-change overlay (hidden file input).
    - Inline edit mode for name, employee code, department, and email fields.
    - Separate "Save Photo" and "Save Changes" actions.
  - `PATCH /api/employees/{id}/photo` endpoint accepting `multipart/form-data`.
  - `EmployeeServiceImpl.updatePhoto()` saves file to `uploads/employee-photos/{id}.{ext}` and persists the URL on the entity.
  - Flyway migration `V2__add_photo_url_to_employees.sql` — adds `photo_url VARCHAR(512)` column to `employees` table.
  - `WebMvcConfig.java` — serves `uploads/**` directory as static resources so uploaded photos are accessible at `http://localhost:8080/uploads/…`.
  - `uploadEmployeePhoto(id, blob)` added to `employees.js` API module.
  - `EmployeeCard.jsx` updated: shows photo avatar and "Profile" button (EditIcon) navigating to `/employees/:id`.
  - Route `/employees/:id` added to `App.jsx`.

### Added (Documentation)
- `README.md` Section 10 "Test Accounts & Sample Data":
  - Admin credentials (`admin` / `admin123`).
  - 8 sample employee profiles with employee codes and departments.
  - Postman seed guide and testing scenarios table.
  - Subsequent sections renumbered 11–14.

---

## [0.0.1] - 2026-02-XX

### Added
- Initial project scaffold
  - Spring Boot 3.4.2 (Java 23, Gradle KTS) backend
  - React + Vite frontend (MUI, react-webcam, axios)
  - FastAPI + DeepFace face-recognition service
  - PostgreSQL 17.5 database with Flyway migrations
  - JWT authentication (`/api/auth/login`)
  - Employee CRUD (`/api/employees`)
  - Attendance time-in / time-out (`/api/attendance`)
  - Face registration and verification endpoints
  - `BundyClock.jsx` kiosk page
  - `FaceRegistration.jsx` employee enrollment page
  - `AttendanceLogs.jsx`, `EmployeeList.jsx`, `Login.jsx` pages
  - Postman collection (`bundyclock-postman-collection.json`)
  - Phase plan (`PHASE_PLAN.md`)
