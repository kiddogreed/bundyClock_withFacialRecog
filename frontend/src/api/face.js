import api from './axiosClient'

/**
 * POST /api/face/verify
 * @param {Blob} imageBlob — JPEG/PNG captured from webcam
 */
// Face calls run DeepFace which can take 30-90s on first load
const FACE_TIMEOUT = 120_000

export const verifyFace = (imageBlob) => {
  const formData = new FormData()
  formData.append('image', imageBlob, 'verify.jpg')
  // Do NOT set Content-Type manually — axios sets it with the correct multipart boundary
  return api.post('/face/verify', formData, { timeout: FACE_TIMEOUT })
}

/**
 * POST /api/face/register
 * @param {string} employeeId — UUID
 * @param {Blob}   imageBlob  — JPEG/PNG captured from webcam
 */
export const registerFace = (employeeId, imageBlob) => {
  const formData = new FormData()
  formData.append('employeeId', employeeId)
  formData.append('image', imageBlob, 'register.jpg')
  return api.post('/face/register', formData, { timeout: FACE_TIMEOUT })
}

/**
 * GET /api/face/employee/:employeeId/status
 * Returns { employeeId, embeddingCount, registered, lastRegisteredAt }
 */
export const getFaceStatus = (employeeId) =>
  api.get(`/face/employee/${employeeId}/status`)
