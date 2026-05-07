import axios from 'axios'
import {
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  clearSession,
} from '../auth/tokenStorage'
import { isTokenExpired } from '../auth/jwt'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

let onAuthFailure = null
export function setAuthFailureHandler(fn) {
  onAuthFailure = fn
}

let refreshPromise = null

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshPromise = axios
    .create({ baseURL: api.defaults.baseURL })
    .post('/auth/refresh', { refreshToken })
    .then((res) => {
      const next = res.data?.accessToken
      if (next) updateAccessToken(next)
      return next || null
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

api.interceptors.request.use(async (config) => {
  if (config.skipAuth) return config

  let token = getAccessToken()
  if (token && isTokenExpired(token, 5000)) {
    const next = await refreshAccessToken()
    token = next || null
  }
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}
    const status = error.response?.status

    if (status === 401 && !original._retry && !original.skipAuth) {
      original._retry = true
      const next = await refreshAccessToken()
      if (next) {
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${next}`
        return api(original)
      }
      clearSession()
      if (typeof onAuthFailure === 'function') onAuthFailure()
    }

    return Promise.reject(error)
  },
)
