import api from './axiosClient'

/**
 * POST /api/attendance/time-in
 * @param {string} employeeId
 * @param {Blob|null} imageBlob
 */
export const timeIn = (employeeId, imageBlob = null) => {
  const formData = new FormData()
  if (imageBlob) formData.append('image', imageBlob, 'capture.jpg')
  // employeeId goes as query param (@RequestParam); do NOT override Content-Type
  return api.post('/attendance/time-in', formData, { params: { employeeId } })
}

/**
 * POST /api/attendance/time-out
 */
export const timeOut = (employeeId, imageBlob = null) => {
  const formData = new FormData()
  if (imageBlob) formData.append('image', imageBlob, 'capture.jpg')
  return api.post('/attendance/time-out', formData, { params: { employeeId } })
}

/** GET /api/attendance */
export const getAllLogs = () =>
  api.get('/attendance')

/** GET /api/attendance/employee/:employeeId */
export const getLogsByEmployee = (employeeId) =>
  api.get(`/attendance/employee/${employeeId}`)
