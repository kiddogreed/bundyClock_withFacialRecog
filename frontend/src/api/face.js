import api from './axiosClient'

/**
 * POST /api/face/verify
 * @param {Blob} imageBlob — JPEG/PNG captured from webcam
 */
export const verifyFace = (imageBlob) => {
  const formData = new FormData()
  formData.append('image', imageBlob, 'verify.jpg')
  return api.post('/face/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * POST /api/face/register
 * @param {string} employeeId
 * @param {Blob} imageBlob
 */
export const registerFace = (employeeId, imageBlob) => {
  const formData = new FormData()
  formData.append('image', imageBlob, 'register.jpg')
  return api.post('/face/register', formData, {
    params: { employeeId },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
