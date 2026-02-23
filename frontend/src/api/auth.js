import api from './axiosClient'

/**
 * POST /api/auth/login
 * @param {{ username: string, password: string }} credentials
 */
export const login = (credentials) =>
  api.post('/auth/login', credentials)

/**
 * POST /api/auth/logout  (placeholder — real logout is client-side for MVP)
 */
export const logout = () =>
  Promise.resolve()
