import api from './axiosClient'

/** GET /api/employees */
export const getEmployees = () =>
  api.get('/employees')

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
