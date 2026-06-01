import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/orderApi', () => ({
  getOrder: vi.fn(),
  updateOrder: vi.fn(),
}))

vi.mock('../i18n/useI18n', () => ({
  default: () => ({
    t: {
      quantity: {
        invalidNumber: 'invalid number',
        belowMin: (min) => `min ${min}`,
        aboveMax: (_min, max) => `max ${max}`,
      },
      datePicker: {
        todayLabel: 'today',
        daysOut: (n) => `${n}d`,
      },
      editOrder: {
        qtyRequired: 'qty required',
      },
    },
  }),
}))

import useEditOrder from './useEditOrder'
import { getOrder, updateOrder } from '../api/orderApi'

const BASE_ORDER = {
  id: 'WO-1',
  customerCode: 'C001',
  customerName: 'Acme',
  quantity: 100,
  status: 'SCHEDULED',
  customerDueDate: '2026-06-15',
  expectedDueDate: '2026-06-15',
  delayDays: 0,
  scheduleWarning: null,
  createdAt: '2026-05-01T10:00:00',
  updatedAt: '2026-05-10T10:00:00',
}

beforeEach(() => {
  // Always return a fresh copy so mutations in one test don't leak.
  getOrder.mockImplementation(() => Promise.resolve({ data: { ...BASE_ORDER } }))
})

/**
 * useEditOrder 的關鍵不變量：
 *  - 載入時把 backend 的 updatedAt 記下來，submit 時原封不動送回（樂觀鎖契約）
 *  - 收到 409 → 不拋例外，改設 conflicted=true 讓 UI 出 modal
 *  - 不更動任何欄位時 canSubmit=false（dirty 檢查）
 */
describe('useEditOrder', () => {
  it('loads the order and seeds qty / dueDate / updatedAt', async () => {
    const { result } = renderHook(() => useEditOrder('WO-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.order.id).toBe('WO-1')
    expect(result.current.qty).toBe('100')
    // updatedAt is kept on the hook's order snapshot for later round-tripping
    expect(result.current.order.updatedAt).toBe('2026-05-10T10:00:00')
  })

  it('canSubmit is false until the user actually changes something', async () => {
    const { result } = renderHook(() => useEditOrder('WO-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.dirty).toBe(false)
    expect(result.current.canSubmit).toBe(false)

    act(() => result.current.updateQty('200'))
    expect(result.current.dirty).toBe(true)
    expect(result.current.canSubmit).toBe(true)
  })

  it('handles 409 by setting conflicted=true instead of throwing', async () => {
    updateOrder.mockRejectedValueOnce({
      response: { status: 409, data: { message: '訂單已被他人修改' } },
    })

    const { result } = renderHook(() => useEditOrder('WO-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.updateQty('200'))

    let outcome
    await act(async () => {
      outcome = await result.current.submit()
    })
    // 不可重新拋給呼叫端（UI 已用 conflicted 旗標處理）
    expect(outcome).toBeNull()
    await waitFor(() => expect(result.current.conflicted).toBe(true))
  })

  it('clearConflict resets the conflicted flag', async () => {
    updateOrder.mockRejectedValueOnce({ response: { status: 409 } })

    const { result } = renderHook(() => useEditOrder('WO-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.updateQty('200'))
    await act(async () => {
      await result.current.submit()
    })
    await waitFor(() => expect(result.current.conflicted).toBe(true))

    act(() => result.current.clearConflict())
    expect(result.current.conflicted).toBe(false)
  })

  it('throws non-409 errors with backend message (for toast)', async () => {
    updateOrder.mockRejectedValueOnce({
      response: { status: 400, data: { message: '交期必須晚於今日' } },
    })

    const { result } = renderHook(() => useEditOrder('WO-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.updateQty('200'))

    await expect(
      act(async () => {
        await result.current.submit()
      }),
    ).rejects.toThrow(/交期/)
    expect(result.current.conflicted).toBe(false)
  })
})
