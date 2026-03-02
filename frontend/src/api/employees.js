import api from './axiosClient'

/**
 * GET /api/employees
 * @param {number} page  0-based page index (default 0)
 * @param {number} size  items per page (default 20)
 */
export const getEmployees = (page = 0, size = 20) =>
  api.get('/employees', { params: { page, size } })

/** GET /api/employees/:id */
export const getEmployee = (id) =>
  api.get(`/employees/${id}`)

/**
 * POST /api/employees
 * @param {{ name: string, employeeCode: string, department: string, email: string }} employee
 */
export const createEmployee = (employee) =>
  api.post('/employees', employee)

/**
 * PUT /api/employees/:id
 */
export const updateEmployee = (id, employee) =>
  api.put(`/employees/${id}`, employee)

/** DELETE /api/employees/:id */
export const deleteEmployee = (id) =>
  api.delete(`/employees/${id}`)

/**
 * PATCH /api/employees/:id/photo
 * @param {string} id
 * @param {Blob} photoBlob
 */
export const uploadEmployeePhoto = (id, photoBlob) => {
  const formData = new FormData()
  formData.append('photo', photoBlob, 'photo.jpg')
  // Do NOT set Content-Type manually — axios must auto-set it with the multipart boundary
  return api.patch(`/employees/${id}/photo`, formData, {
    timeout: 30000,
  })
}
