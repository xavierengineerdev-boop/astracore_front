import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { login as apiLogin, me as apiMe, refresh as apiRefresh } from '@/api/auth'
import { AUTH_LOGOUT_EVENT } from '@/api/client'

export type User = { userId: string; email: string; role: string; firstName?: string; lastName?: string; lastLoginAt?: string; departmentId?: string }

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const REFRESH_INTERVAL_MS = 55 * 60 * 1000

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const setTokens = useCallback((access: string, refresh?: string) => {
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh != null) localStorage.setItem(REFRESH_KEY, refresh)
  }, [])

  const clearTokens = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    const handleLogout = () => {
      clearTokens()
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout)
  }, [clearTokens])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const access = localStorage.getItem(ACCESS_KEY)
      const refreshToken = localStorage.getItem(REFRESH_KEY)

      if (!access && !refreshToken) {
        setLoading(false)
        return
      }

      try {
        if (access) {
          const u = await apiMe(access)
          if (!cancelled) setUser(u)
          setLoading(false)
          return
        }
      } catch {
        /* access invalid, try refresh */
      }

      if (!refreshToken) {
        clearTokens()
        setLoading(false)
        return
      }

      try {
        const { access_token } = await apiRefresh(refreshToken)
        setTokens(access_token)
        const u = await apiMe(access_token)
        if (!cancelled) setUser(u)
      } catch {
        if (!cancelled) clearTokens()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [setTokens, clearTokens])

  useEffect(() => {
    if (!user || !localStorage.getItem(REFRESH_KEY)) return
    if (refreshTimerRef.current) return
    refreshTimerRef.current = setInterval(async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY)
      if (!refreshToken) return
      try {
        const { access_token } = await apiRefresh(refreshToken)
        setTokens(access_token)
      } catch {
        clearTokens()
      }
    }, REFRESH_INTERVAL_MS)
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [user, setTokens, clearTokens])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const data = await apiLogin(email, password)
      setTokens(data.access_token, data.refresh_token)
      const u = await apiMe(data.access_token)
      setUser(u)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearTokens()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthProvider
