const ACCESS_KEY = 'woms.accessToken'
const REFRESH_KEY = 'woms.refreshToken'
const USER_KEY = 'woms.user'
const PERSIST_FLAG = 'woms.persist'

function pickStorage() {
  if (typeof window === 'undefined') return null
  const persist = window.localStorage.getItem(PERSIST_FLAG) === '1'
  return persist ? window.localStorage : window.sessionStorage
}

function readFromAny(key) {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
  )
}

function clearFromAll(key) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
  window.sessionStorage.removeItem(key)
}

export function setSession({ accessToken, refreshToken, user, remember }) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PERSIST_FLAG, remember ? '1' : '0')
  const storage = remember ? window.localStorage : window.sessionStorage
  const other = remember ? window.sessionStorage : window.localStorage

  storage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) storage.setItem(REFRESH_KEY, refreshToken)
  if (user) storage.setItem(USER_KEY, JSON.stringify(user))

  other.removeItem(ACCESS_KEY)
  other.removeItem(REFRESH_KEY)
  other.removeItem(USER_KEY)
}

export function getAccessToken() {
  return readFromAny(ACCESS_KEY)
}

export function getRefreshToken() {
  return readFromAny(REFRESH_KEY)
}

export function getStoredUser() {
  const raw = readFromAny(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function updateAccessToken(accessToken) {
  const storage = pickStorage()
  if (!storage) return
  storage.setItem(ACCESS_KEY, accessToken)
}

export function clearSession() {
  clearFromAll(ACCESS_KEY)
  clearFromAll(REFRESH_KEY)
  clearFromAll(USER_KEY)
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(PERSIST_FLAG)
  }
}
