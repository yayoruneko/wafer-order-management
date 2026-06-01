import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/orderApi', () => ({
  getOrders: vi.fn(),
  getOrderStats: vi.fn(),
  cancelOrder: vi.fn(),
}))

import useOrders, { PAGE_SIZE } from './useOrders'
import { cancelOrder, getOrders, getOrderStats } from '../api/orderApi'

function makeOrder(over = {}) {
  return {
    id: 'WO-1',
    customerId: 'c-1',
    customerCode: 'C001',
    customerName: 'Acme',
    quantity: 100,
    status: 'SCHEDULED',
    customerDueDate: '2026-07-01',
    expectedDueDate: '2026-07-01',
    delayDays: 0,
    scheduleWarning: null,
    createdByUsername: 'u1',
    ...over,
  }
}

const STATS = {
  total: 3, inProduction: 1, delayed: 1, totalWafers: 1234,
  allCount: 2, delayedCount: 1, inProductionCount: 1, mineCount: 2,
}

beforeEach(() => {
  getOrderStats.mockResolvedValue({ data: STATS })
})

/**
 * useOrders 是 OrderListPage 的核心：負責 fetch + filter + view + sort + pagination
 * + 樂觀取消 + bulk select。覆蓋下列關鍵不變量：
 *
 *  - view='cancelled' 只顯示 CANCELLED，view='history' 只顯示 COMPLETED，
 *    其他 view 兩種都被排除（前端三類互斥分頁）
 *  - search 會把 filters 套到下次 getOrders 的 params 上
 *  - optimisticCancel 立即把該筆從非取消視圖移除（不等 backend）
 *  - cancelSelected 對每個選取項目都 DELETE
 *  - pagination 分頁邊界正確
 */
describe('useOrders', () => {
  it('initial load fetches orders + stats and excludes CANCELLED/COMPLETED from default view', async () => {
    // On mount both fetchOrders and fetchHistoryMeta call getOrders — give them
    // the same dataset; the hook will filter for display in the default view.
    getOrders.mockResolvedValue({
      data: [
        makeOrder({ id: 'a', status: 'SCHEDULED' }),
        makeOrder({ id: 'b', status: 'CANCELLED' }),
        makeOrder({ id: 'c', status: 'COMPLETED' }),
      ],
    })

    const { result } = renderHook(() => useOrders())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders.map((o) => o.id)).toEqual(['a'])
    expect(result.current.stats.totalWafers).toBe(1234)
  })

  it('view="cancelled" returns only CANCELLED orders', async () => {
    getOrders.mockResolvedValue({
      data: [
        makeOrder({ id: 'a', status: 'SCHEDULED' }),
        makeOrder({ id: 'b', status: 'CANCELLED' }),
      ],
    })

    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.changeView('cancelled'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.orders.map((o) => o.id)).toEqual(['b'])
  })

  it('view="history" returns only COMPLETED orders', async () => {
    getOrders.mockResolvedValue({
      data: [
        makeOrder({ id: 'a', status: 'SCHEDULED' }),
        makeOrder({ id: 'c', status: 'COMPLETED' }),
      ],
    })

    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.changeView('history'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.orders.map((o) => o.id)).toEqual(['c'])
  })

  it('search() forwards filters as backend query params (customerName / status / dateRange)', async () => {
    getOrders.mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))
    getOrders.mockClear()

    act(() =>
      result.current.search({
        id: 'WO-42',
        customer: 'Acme',
        status: 'SCHEDULED',
        dateRange: { fromIso: '2026-06-01', toIso: '2026-06-30' },
      }),
    )
    await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(1))
    expect(getOrders.mock.calls[0][0]).toEqual({
      orderId: 'WO-42',
      customerName: 'Acme',
      status: 'SCHEDULED',
      fromDate: '2026-06-01',
      toDate: '2026-06-30',
    })
  })

  it('search() with status="ALL" omits status from params', async () => {
    getOrders.mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))
    getOrders.mockClear()

    act(() =>
      result.current.search({
        id: '', customer: '', status: 'ALL', dateRange: { fromIso: '', toIso: '' },
      }),
    )
    await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(1))
    expect(getOrders.mock.calls[0][0]).toEqual({})
  })

  it('optimisticCancel removes the order from the non-cancelled view immediately', async () => {
    getOrders.mockResolvedValue({
      data: [
        makeOrder({ id: 'a', status: 'SCHEDULED' }),
        makeOrder({ id: 'b', status: 'SCHEDULED' }),
      ],
    })

    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders.map((o) => o.id)).toEqual(['a', 'b'])

    act(() => result.current.optimisticCancel({ id: 'a' }))
    expect(result.current.orders.map((o) => o.id)).toEqual(['b'])
  })

  it('cancelSelected calls cancelOrder for every selected id and refetches', async () => {
    getOrders.mockResolvedValue({
      data: [makeOrder({ id: 'a' }), makeOrder({ id: 'b' }), makeOrder({ id: 'c' })],
    })
    cancelOrder.mockResolvedValue({})

    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.toggleSelect('a'))
    act(() => result.current.toggleSelect('c'))

    await act(async () => {
      await result.current.cancelSelected()
    })

    expect(cancelOrder).toHaveBeenCalledTimes(2)
    expect(cancelOrder.mock.calls.map((c) => c[0]).sort()).toEqual(['a', 'c'])
    // selection cleared after bulk cancel
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('paginates when the result set exceeds PAGE_SIZE', async () => {
    const many = Array.from({ length: PAGE_SIZE + 5 }, (_, i) =>
      makeOrder({ id: `WO-${i}` }),
    )
    getOrders.mockResolvedValue({ data: many })

    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.orders).toHaveLength(PAGE_SIZE)
    expect(result.current.totalPages).toBe(2)

    act(() => result.current.nextPage())
    expect(result.current.page).toBe(2)
    expect(result.current.orders).toHaveLength(5)
  })

  it('sets error=true when getOrders rejects', async () => {
    getOrders.mockRejectedValue(new Error('network'))

    const { result } = renderHook(() => useOrders())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe(true)
    expect(result.current.orders).toEqual([])
  })
})
