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

  it('stores session in both storages when remember=true', () => {
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
    // 本分頁也要有，才能跟其他分頁隔離
    expect(window.sessionStorage.getItem('woms.accessToken')).toBe('a1')
    // 同時寫入 localStorage 當持久化備援
    expect(window.localStorage.getItem('woms.accessToken')).toBe('a1')
  })

  it('stores session only in sessionStorage when remember=false', () => {
    setSession({
      accessToken: 'a2',
      refreshToken: 'r2',
      user: { username: 'u2' },
      remember: false,
    })

    expect(window.localStorage.getItem('woms.persist')).toBeNull()
    expect(getAccessToken()).toBe('a2')
    expect(getRefreshToken()).toBe('r2')
    expect(getStoredUser()).toEqual({ username: 'u2' })
    expect(window.localStorage.getItem('woms.accessToken')).toBeNull()
  })

  it('updateAccessToken updates sessionStorage and mirrors to localStorage when remembered', () => {
    setSession({ accessToken: 'a1', refreshToken: 'r1', remember: true })
    updateAccessToken('a1b')
    expect(getAccessToken()).toBe('a1b')
    // 持久化備援也要跟著更新，下次開瀏覽器才不會用到舊 token
    expect(window.localStorage.getItem('woms.accessToken')).toBe('a1b')

    setSession({ accessToken: 'a2', refreshToken: 'r2', remember: false })
    updateAccessToken('a2b')
    expect(getAccessToken()).toBe('a2b')
    // 沒勾記住我就不要把 token 寫進 localStorage
    expect(window.localStorage.getItem('woms.accessToken')).toBeNull()
  })

  it('clearSession clears all keys from both storages', () => {
    setSession({ accessToken: 'a1', refreshToken: 'r1', user: { x: 1 }, remember: true })
    clearSession()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
    expect(window.localStorage.getItem('woms.persist')).toBeNull()
  })

  it('setSession without refreshToken does not store a refresh token', () => {
    setSession({ accessToken: 'a1', remember: true })
    expect(getRefreshToken()).toBeNull()
    expect(getAccessToken()).toBe('a1')
  })

  it('setSession without user does not store user', () => {
    setSession({ accessToken: 'a1', refreshToken: 'r1', remember: false })
    expect(getStoredUser()).toBeNull()
  })

  it('setSession clears persistent storage when switching to remember=false', () => {
    setSession({ accessToken: 'old', refreshToken: 'r1', remember: true })
    expect(window.localStorage.getItem('woms.accessToken')).toBe('old')

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

  // ── Cross-tab 隔離行為 ────────────────────────────────────────────────────
  // 多帳號同瀏覽器：不同分頁的 sessionStorage 各自獨立，
  // 即使 localStorage 被另一分頁覆蓋，本分頁讀到的仍是自己當時登入的 token。

  it('readFromAny prefers sessionStorage when both storages have a value', () => {
    window.localStorage.setItem('woms.accessToken', 'from-local')
    window.sessionStorage.setItem('woms.accessToken', 'from-session')
    expect(getAccessToken()).toBe('from-session')
  })

  it('readFromAny falls back to localStorage and seeds sessionStorage on first read', () => {
    window.localStorage.setItem('woms.accessToken', 'from-local')
    expect(window.sessionStorage.getItem('woms.accessToken')).toBeNull()

    expect(getAccessToken()).toBe('from-local')
    // 回填本分頁的 sessionStorage，之後其他分頁覆寫 localStorage 不會影響本分頁
    expect(window.sessionStorage.getItem('woms.accessToken')).toBe('from-local')
  })
})
