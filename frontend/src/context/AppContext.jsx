import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('bc_token') || null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  const isAuthenticated = !!token

  const login = useCallback((userData, jwt) => {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('bc_token', jwt)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('bc_token')
  }, [])

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }, [])

  return (
    <AppContext.Provider value={{
      user, token, isAuthenticated,
      login, logout,
      snackbar, showSnackbar, closeSnackbar,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
