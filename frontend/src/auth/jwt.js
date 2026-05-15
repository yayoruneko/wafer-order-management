function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const decoded = atob(padded + pad)
  try {
    return decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
  } catch {
    return decoded
  }
}

export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

export function getTokenExpiry(token) {
  const payload = decodeJwt(token)
  if (!payload || typeof payload.exp !== 'number') return null
  return payload.exp * 1000
}

export function isTokenExpired(token, skewMs = 0) {
  const expMs = getTokenExpiry(token)
  if (expMs == null) return false
  return Date.now() + skewMs >= expMs
}
