import { act, render, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/authApi', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}))
vi.mock('../api/client', () => ({
  setAuthFailureHandler: vi.fn(),
}))
vi.mock('./tokenStorage', () => ({
  clearSession: vi.fn(),
  getAccessToken: vi.fn(),
  getStoredUser: vi.fn(),
  setSession: vi.fn(),
}))

import { AuthProvider } from './AuthProvider'
import useAuth from './useAuth'
import * as authApi from '../api/authApi'
import { setAuthFailureHandler } from '../api/client'
import * as storage from './tokenStorage'

function makeJwt(payload) {
  const b64 = (o) =>
    Buffer.from(JSON.stringify(o))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`
}

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

beforeEach(() => {
  storage.getAccessToken.mockReturnValue(null)
  storage.getStoredUser.mockReturnValue(null)
})

/**
 * AuthProvider 是整個前端的權限樞紐：
 *  - 初始化從 storage 還原使用者（若 token 未過期）
 *  - login() 成功會把 token + user 寫進 storage 並更新 context
 *  - logout() 會清掉 storage 並把 user 設回 null
 *  - 註冊 401 失敗 handler，讓 axios 攔截器可以踢使用者出去
 */
describe('AuthProvider', () => {
  it('starts unauthenticated when there is no token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('restores user from a non-expired stored token via decodeJwt', () => {
    const future = Math.floor((Date.now() + 60_000) / 1000)
    storage.getAccessToken.mockReturnValue(
      makeJwt({ sub: 'alice', role: 'ADMIN', exp: future }),
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user.username).toBe('alice')
    expect(result.current.user.role).toBe('ADMIN')
  })

  it('treats an expired token as unauthenticated', () => {
    const past = Math.floor((Date.now() - 60_000) / 1000)
    storage.getAccessToken.mockReturnValue(makeJwt({ sub: 'alice', exp: past }))

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('login() writes session and flips isAuthenticated to true', async () => {
    authApi.login.mockResolvedValueOnce({
      accessToken: 'a1',
      refreshToken: 'r1',
      user: { username: 'bob', displayName: 'Bob', role: 'VIEWER' },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.login({ username: 'bob', password: 'pw', remember: true })
    })

    expect(storage.setSession).toHaveBeenCalledWith({
      accessToken: 'a1',
      refreshToken: 'r1',
      user: { username: 'bob', displayName: 'Bob', role: 'VIEWER' },
      remember: true,
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user.username).toBe('bob')
  })

  it('logout() clears the session and unsets the user', async () => {
    const future = Math.floor((Date.now() + 60_000) / 1000)
    storage.getAccessToken.mockReturnValue(makeJwt({ sub: 'alice', exp: future }))
    authApi.logout.mockResolvedValueOnce({})

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      result.current.logout()
      // wait for the promise chain inside logout() to settle
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(storage.clearSession).toHaveBeenCalled()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('registers a 401 failure handler on the api client', () => {
    render(
      <AuthProvider>
        <span />
      </AuthProvider>,
    )
    expect(setAuthFailureHandler).toHaveBeenCalled()
    // The registered handler should be a function (axios interceptor calls it)
    const fn = setAuthFailureHandler.mock.calls[0][0]
    expect(typeof fn).toBe('function')
  })
})
