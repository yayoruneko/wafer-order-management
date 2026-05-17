import { api } from './client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH !== 'false'

function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function buildMockJwt(payload) {
  const header = { alg: 'none', typ: 'JWT' }
  return [
    base64UrlEncode(JSON.stringify(header)),
    base64UrlEncode(JSON.stringify(payload)),
    'mock-signature',
  ].join('.')
}

function resolveMockRole(username) {
  const u = (username || '').trim().toLowerCase()
  if (u === 'super' || u === 'superadmin' || u === 'root') return 'SUPER_ADMIN'
  if (u === 'admin') return 'ADMIN'
  return 'VIEWER'
}

async function mockLogin({ username, password }) {
  await new Promise((r) => setTimeout(r, 500))
  if (password !== 'demo') {
    const err = new Error('Invalid credentials')
    err.response = { status: 401 }
    throw err
  }
  const now = Math.floor(Date.now() / 1000)
  const role = resolveMockRole(username)
  const accessToken = buildMockJwt({
    sub: username,
    name: username,
    role,
    iat: now,
    exp: now + 60 * 60,
  })
  const refreshToken = buildMockJwt({
    sub: username,
    type: 'refresh',
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  })
  return {
    accessToken,
    refreshToken,
    user: { username, displayName: username, role },
  }
}

export async function login(credentials) {
  if (USE_MOCK) return mockLogin(credentials)
  const { data } = await api.post('/auth/login', credentials, {
    skipAuth: true,
  })
  return data
}

export async function logout() {
  if (USE_MOCK) return
  try {
    await api.post('/auth/logout')
  } catch {
    // best-effort; client will clear session regardless
  }
}

export async function me() {
  const { data } = await api.get('/auth/me')
  return data
}
