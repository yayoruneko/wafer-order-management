import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/authApi'
import { setAuthFailureHandler } from '../api/client'
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  setSession,
} from './tokenStorage'
import { decodeJwt, isTokenExpired } from './jwt'
import { AuthContext } from './authContext'

function resolveUser(storedUser, token) {
  if (storedUser) return storedUser
  const payload = decodeJwt(token)
  if (!payload) return null
  return {
    username: payload.sub || payload.username || '',
    displayName: payload.name || payload.sub || '',
    role: payload.role || null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = getAccessToken()
    if (!token || isTokenExpired(token)) return null
    return resolveUser(getStoredUser(), token)
  })
  const [initializing, setInitializing] = useState(false)

  const logout = useCallback(() => {
    authApi.logout().finally(() => {
      clearSession()
      setUser(null)
    })
  }, [])

  useEffect(() => {
    setAuthFailureHandler(() => {
      clearSession()
      setUser(null)
    })
    return () => setAuthFailureHandler(null)
  }, [])

  const login = useCallback(async ({ username, password, remember }) => {
    setInitializing(true)
    try {
      const { accessToken, refreshToken, user: nextUser } = await authApi.login({
        username,
        password,
      })
      setSession({
        accessToken,
        refreshToken,
        user: nextUser,
        remember: !!remember,
      })
      const resolved = nextUser || resolveUser(null, accessToken)
      setUser(resolved)
      return resolved
    } finally {
      setInitializing(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      initializing,
      login,
      logout,
    }),
    [user, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
