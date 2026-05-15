import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setSession,
  updateAccessToken,
} from './tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('stores session in localStorage when remember=true', () => {
    setSession({
      accessToken: 'a1',
      refreshToken: 'r1',
      user: { username: 'u1' },
      remember: true,
    })

    expect(window.localStorage.getItem('woms.persist')).toBe('1')
    expect(getAccessToken()).toBe('a1')
    expect(getRefreshToken()).toBe('r1')
    expect(getStoredUser()).toEqual({ username: 'u1' })
    expect(window.sessionStorage.getItem('woms.accessToken')).toBeNull()
  })

  it('stores session in sessionStorage when remember=false', () => {
    setSession({
      accessToken: 'a2',
      refreshToken: 'r2',
      user: { username: 'u2' },
      remember: false,
    })

    expect(window.localStorage.getItem('woms.persist')).toBe('0')
    expect(getAccessToken()).toBe('a2')
    expect(getRefreshToken()).toBe('r2')
    expect(getStoredUser()).toEqual({ username: 'u2' })
    expect(window.localStorage.getItem('woms.accessToken')).toBeNull()
  })

  it('updateAccessToken writes to currently selected storage', () => {
    setSession({ accessToken: 'a1', refreshToken: 'r1', remember: true })
    updateAccessToken('a1b')
    expect(getAccessToken()).toBe('a1b')

    setSession({ accessToken: 'a2', refreshToken: 'r2', remember: false })
    updateAccessToken('a2b')
    expect(getAccessToken()).toBe('a2b')
  })

  it('clearSession clears all keys from both storages', () => {
    setSession({ accessToken: 'a1', refreshToken: 'r1', user: { x: 1 }, remember: true })
    clearSession()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
    expect(window.localStorage.getItem('woms.persist')).toBeNull()
  })

  // ── New test cases ────────────────────────────────────────────────────────

  it('setSession without refreshToken does not store a refresh token', () => {
    setSession({ accessToken: 'a1', remember: true })
    expect(getRefreshToken()).toBeNull()
    expect(getAccessToken()).toBe('a1')
  })

  it('setSession without user does not store user', () => {
    setSession({ accessToken: 'a1', refreshToken: 'r1', remember: false })
    expect(getStoredUser()).toBeNull()
  })

  it('setSession clears old storage when switching remember flag', () => {
    // First login with remember=true → localStorage
    setSession({ accessToken: 'old', refreshToken: 'r1', remember: true })
    expect(window.localStorage.getItem('woms.accessToken')).toBe('old')

    // Second login with remember=false → sessionStorage, localStorage cleared
    setSession({ accessToken: 'new', refreshToken: 'r2', remember: false })
    expect(window.sessionStorage.getItem('woms.accessToken')).toBe('new')
    expect(window.localStorage.getItem('woms.accessToken')).toBeNull()
  })

  it('getStoredUser returns null when stored value is corrupt JSON', () => {
    window.localStorage.setItem('woms.persist', '1')
    window.localStorage.setItem('woms.user', '{not valid json}')
    expect(getStoredUser()).toBeNull()
  })

  it('clearSession on empty storage does not throw', () => {
    expect(() => clearSession()).not.toThrow()
  })
})
