import api from './axiosClient'

// Attendance calls hit Spring Boot which may take longer on JVM warm-up
const ATTENDANCE_TIMEOUT = 60_000

/**
 * POST /api/attendance/time-in
 * @param {string} employeeId
 * @param {Blob|null} imageBlob
 */
export const timeIn = (employeeId, imageBlob = null) => {
  const formData = new FormData()
  if (imageBlob) formData.append('image', imageBlob, 'capture.jpg')
  // employeeId goes as query param (@RequestParam); do NOT override Content-Type
  return api.post('/attendance/time-in', formData, { params: { employeeId }, timeout: ATTENDANCE_TIMEOUT })
}

/**
 * POST /api/attendance/time-out
 */
export const timeOut = (employeeId, imageBlob = null) => {
  const formData = new FormData()
  if (imageBlob) formData.append('image', imageBlob, 'capture.jpg')
  return api.post('/attendance/time-out', formData, { params: { employeeId }, timeout: ATTENDANCE_TIMEOUT })
}

/** GET /api/attendance */
export const getAllLogs = () =>
  api.get('/attendance')

/**
 * GET /api/attendance
 * All params are optional — any combination works.
 * @param {string|null} employeeId
 * @param {string|null} from  ISO-8601 datetime, e.g. '2026-03-01T00:00:00Z'
 * @param {string|null} to    ISO-8601 datetime
 */
export const getLogsInRange = (employeeId = null, from = null, to = null) => {
  const params = {}
  if (employeeId) params.employeeId = employeeId
  if (from) params.from = from
  if (to)   params.to   = to
  return api.get('/attendance', { params })
}

/** GET /api/attendance/employee/:employeeId */
export const getLogsByEmployee = (employeeId) =>
  api.get(`/attendance/employee/${employeeId}`)
