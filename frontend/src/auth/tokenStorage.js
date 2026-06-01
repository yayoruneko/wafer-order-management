const ACCESS_KEY = 'woms.accessToken'
const REFRESH_KEY = 'woms.refreshToken'
const USER_KEY = 'woms.user'
const PERSIST_FLAG = 'woms.persist'

// sessionStorage 是分頁專屬；localStorage 在同 origin 所有分頁共用。
// 讀取一律先看本分頁 sessionStorage，沒值才回退到 localStorage 的持久化
// 備援，並把備援值複製進 sessionStorage —— 之後本分頁就跟其他分頁完全隔離。
function readFromAny(key) {
  if (typeof window === 'undefined') return null
  const fromSession = window.sessionStorage.getItem(key)
  if (fromSession !== null) return fromSession
  const fromLocal = window.localStorage.getItem(key)
  if (fromLocal !== null) {
    window.sessionStorage.setItem(key, fromLocal)
  }
  return fromLocal
}

function clearFromAll(key) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
  window.sessionStorage.removeItem(key)
}

export function setSession({ accessToken, refreshToken, user, remember }) {
  if (typeof window === 'undefined') return

  // 本分頁的 session 永遠寫進 sessionStorage，達成分頁間多帳號隔離
  window.sessionStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) window.sessionStorage.setItem(REFRESH_KEY, refreshToken)
  if (user) window.sessionStorage.setItem(USER_KEY, JSON.stringify(user))

  if (remember) {
    // 勾「記住我」：寫進 localStorage 當持久化備援，下次開瀏覽器仍能自動回填
    window.localStorage.setItem(PERSIST_FLAG, '1')
    window.localStorage.setItem(ACCESS_KEY, accessToken)
    if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken)
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    // 不勾「記住我」：清掉舊的持久化資料，避免上次的 token 被誤帶
    window.localStorage.removeItem(PERSIST_FLAG)
    window.localStorage.removeItem(ACCESS_KEY)
    window.localStorage.removeItem(REFRESH_KEY)
    window.localStorage.removeItem(USER_KEY)
  }
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
  if (typeof window === 'undefined') return
  // 本分頁 sessionStorage 一定更新；若使用者當時有勾「記住我」（localStorage
  // 留有 token），也一併更新 localStorage 以維持持久化備援。
  window.sessionStorage.setItem(ACCESS_KEY, accessToken)
  if (window.localStorage.getItem(ACCESS_KEY) !== null) {
    window.localStorage.setItem(ACCESS_KEY, accessToken)
  }
}

export function clearSession() {
  clearFromAll(ACCESS_KEY)
  clearFromAll(REFRESH_KEY)
  clearFromAll(USER_KEY)
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(PERSIST_FLAG)
  }
}
