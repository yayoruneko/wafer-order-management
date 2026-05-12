import { describe, expect, it } from 'vitest'
import { decodeJwt, getTokenExpiry, isTokenExpired } from './jwt'

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function makeToken(payload) {
  return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.sig`
}

describe('jwt helpers', () => {
  it('decodeJwt returns payload for a valid 3-part token', () => {
    const token = makeToken({ sub: 'u1', exp: 123 })
    expect(decodeJwt(token)).toMatchObject({ sub: 'u1', exp: 123 })
  })

  it('decodeJwt returns null for invalid tokens', () => {
    expect(decodeJwt(null)).toBeNull()
    expect(decodeJwt('')).toBeNull()
    expect(decodeJwt('a.b')).toBeNull()
    expect(decodeJwt('a.b.c.d')).toBeNull()
  })

  it('getTokenExpiry returns exp as ms', () => {
    const token = makeToken({ exp: 10 })
    expect(getTokenExpiry(token)).toBe(10 * 1000)
  })

  it('isTokenExpired respects skew', () => {
    const expSoon = Math.floor((Date.now() + 1000) / 1000)
    const token = makeToken({ exp: expSoon })

    expect(isTokenExpired(token, 0)).toBe(false)
    expect(isTokenExpired(token, 5000)).toBe(true)
  })
})
