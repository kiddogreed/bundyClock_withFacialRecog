# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

> Changes staged but not yet given a version tag.

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
