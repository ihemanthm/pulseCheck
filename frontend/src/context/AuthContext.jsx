import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/auth'
import { TOAST_TYPE } from '../utils/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth from localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      setError(null)
      const response = await authAPI.login(username, password)

      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)

      // Fetch user info
      const userInfo = await authAPI.getCurrentUser()
      localStorage.setItem('user', JSON.stringify(userInfo))

      setUser(userInfo)
      setIsAuthenticated(true)

      return { success: true }
    } catch (err) {
      const message = err.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
  }

  const hasRole = (role) => {
    if (!user) return false
    return user.role === role
  }

  const hasAnyRole = (roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    hasRole,
    hasAnyRole
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
