import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,  // default 15s for regular calls
})

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Expired/missing JWT — redirect to login
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('bc_token')
      // Set friendlyMessage before redirecting so any in-flight catch blocks show it
      const serverMsg = typeof error.response?.data === 'object'
        ? (error.response.data?.message || null)
        : null
      error.friendlyMessage = serverMsg ?? 'Your session has expired. Redirecting to login…'
      // Small delay so the error message renders before navigation
      setTimeout(() => { window.location.href = '/login' }, 1500)
      return Promise.reject(error)
    }
    // Network / connection errors — backend not reachable or connection dropped
    const unreachableCodes = ['ERR_NETWORK', 'ECONNREFUSED', 'ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT']
    if (!error.response && (unreachableCodes.includes(error.code) || error.message === 'Network Error')) {
      error.friendlyMessage = 'Cannot reach the server. Please check that all services are running and try again.'
    }
    // Proxy / gateway errors (Vite proxy or nginx returns HTML error page)
    if (error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
      error.friendlyMessage = 'Server is not ready yet. Please wait a moment and try again.'
    }
    return Promise.reject(error)
  },
)

export default api

/**
 * Extract the most user-friendly error message from an axios error.
 * Priority: network-down → server message → fallback string.
 */
export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err.friendlyMessage) return err.friendlyMessage
  return err.response?.data?.message ?? fallback
}
