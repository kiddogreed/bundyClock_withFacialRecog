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
    if (error.response?.status === 401) {
      localStorage.removeItem('bc_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
