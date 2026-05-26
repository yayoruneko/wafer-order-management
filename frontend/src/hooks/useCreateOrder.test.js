import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the entire orderApi module — every API call becomes controllable from tests.
vi.mock('../api/orderApi', () => ({
  getCustomers: vi.fn(),
  createOrder: vi.fn(),
  getOrder: vi.fn(),
  cancelOrder: vi.fn(),
}))

vi.mock('../api/customerApi', () => ({
  createCustomer: vi.fn(),
}))

// Stub i18n with a minimal dictionary so the hook's validation messages render.
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
        weeksOut: (n) => `${n}w`,
      },
    },
  }),
}))

import useCreateOrder from './useCreateOrder'
import { createOrder, getCustomers, getOrder } from '../api/orderApi'

const CUSTOMER = { id: 'c-1', customerCode: 'C001', name: 'Acme' }

beforeEach(() => {
  getCustomers.mockResolvedValue({ data: [CUSTOMER] })
  // Default: simulate happy SCHEDULED + !isDelayed so waitForScheduling exits on first poll.
  getOrder.mockResolvedValue({
    data: { status: 'SCHEDULED', isDelayed: false },
  })
})

/**
 * useCreateOrder 是「下單頁面」的核心 hook：
 *  - 客戶/數量/交期的前端驗證
 *  - 等待 backend 排程結果並回報 ok / delayed
 *  - 出錯時把 backend message 往上拋給 UI 顯示
 *
 * 不使用 fake timers，改讓 mock 在第一輪輪詢就返回終態，
 * 把每個測試的等待時間壓在 ~500ms 內。
 */
describe('useCreateOrder', () => {
  it('rejects quantity below QTY_MIN', async () => {
    const { result } = renderHook(() => useCreateOrder())
    await waitFor(() => expect(result.current.customers.length).toBe(1))

    act(() => result.current.updateQty('24'))
    expect(result.current.qtyError).toMatch(/min/)
    expect(result.current.canSubmit).toBe(false)
  })

  it('rejects quantity above QTY_MAX', async () => {
    const { result } = renderHook(() => useCreateOrder())
    await waitFor(() => expect(result.current.customers.length).toBe(1))

    act(() => result.current.updateQty('2501'))
    expect(result.current.qtyError).toMatch(/max/)
  })

  it('accepts comma-formatted numbers within bounds', async () => {
    const { result } = renderHook(() => useCreateOrder())
    await waitFor(() => expect(result.current.customers.length).toBe(1))

    act(() => result.current.updateQty('1,500'))
    expect(result.current.qtyError).toBeNull()
  })

  it('canSubmit is false until customer, qty and dueDate are all set', async () => {
    const { result } = renderHook(() => useCreateOrder())
    await waitFor(() => expect(result.current.customers.length).toBe(1))

    expect(result.current.canSubmit).toBe(false)            // no customer
    act(() => result.current.selectCustomer(CUSTOMER))
    expect(result.current.canSubmit).toBe(false)            // no qty
    act(() => result.current.updateQty('500'))
    expect(result.current.canSubmit).toBe(true)             // dueDate has default
  })

  it('submit() returns null when !canSubmit and does NOT POST', async () => {
    const { result } = renderHook(() => useCreateOrder())
    await waitFor(() => expect(result.current.customers.length).toBe(1))

    // No customer selected → canSubmit is false
    let outcome
    await act(async () => {
      outcome = await result.current.submit()
    })
    expect(outcome).toBeNull()
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('submit() sends YYYY-MM-DD customerDueDate (LocalDate-compatible)', async () => {
    createOrder.mockResolvedValue({ data: { id: 'WO-1' } })

    const { result } = renderHook(() => useCreateOrder())
    await waitFor(() => expect(result.current.customers.length).toBe(1))

    act(() => result.current.selectCustomer(CUSTOMER))
    act(() => result.current.updateQty('500'))
    act(() => result.current.updateDueDate(new Date(2026, 5, 15)))  // 月份 0-index → 6/15

    await act(async () => {
      await result.current.submit()
    })

    expect(createOrder).toHaveBeenCalledTimes(1)
    const payload = createOrder.mock.calls[0][0]
    expect(payload.customerDueDate).toBe('2026-06-15')
    expect(payload.quantity).toBe(500)
    expect(payload.customerId).toBe('c-1')
  })

  it('submit() returns {status: "ok"} on happy schedule', async () => {
    createOrder.mockResolvedValue({ data: { id: 'WO-1' } })
    // getOrder already returns SCHEDULED + !isDelayed via beforeEach default.

    const { result } = renderHook(() => useCreateOrder())
    await waitFor(() => expect(result.current.customers.length).toBe(1))

    act(() => result.current.selectCustomer(CUSTOMER))
    act(() => result.current.updateQty('500'))

    let outcome
    await act(async () => {
      outcome = await result.current.submit()
    })
    expect(outcome?.status).toBe('ok')
    expect(outcome?.orderId).toBe('WO-1')
  })

  it('submit() rethrows backend message when createOrder rejects', async () => {
    createOrder.mockRejectedValueOnce({
      response: { data: { message: '數量必須在 25 到 2500 之間' } },
    })

    const { result } = renderHook(() => useCreateOrder())
    await waitFor(() => expect(result.current.customers.length).toBe(1))

    act(() => result.current.selectCustomer(CUSTOMER))
    act(() => result.current.updateQty('500'))

    await expect(
      act(async () => {
        await result.current.submit()
      }),
    ).rejects.toThrow(/25/)
  })
})
