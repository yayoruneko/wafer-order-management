import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  api,
  cancelOrder,
  createOrder,
  getOrder,
  getOrderHistory,
  getOrderSlots,
  getOrderStats,
  getOrders,
  triggerRescheduleAll,
  updateOrder,
} from './orderApi'

/**
 * 純單元測試：直接 spy 共享的 axios instance (`api`)，
 * 不需要起後端，比 integration 測試快 100x 並覆蓋每一條路徑。
 *
 * 對應使用情境裡的 edge cases：
 *  - 每個動詞都要打對的 path 與 method
 *  - getOrders 要把 params 透傳給 axios（OrderFilters / view 切頁都靠這個）
 *  - update / cancel 必須帶到該訂單的 id 上，不能誤打到別人
 *  - reject 的錯誤要原封不動向上傳（呼叫端的 try/catch 才能讀到 status）
 */
describe('orderApi (unit)', () => {
  let get, post, put, del

  beforeEach(() => {
    get = vi.spyOn(api, 'get').mockResolvedValue({ data: null })
    post = vi.spyOn(api, 'post').mockResolvedValue({ data: null })
    put = vi.spyOn(api, 'put').mockResolvedValue({ data: null })
    del = vi.spyOn(api, 'delete').mockResolvedValue({ data: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getOrders calls GET /orders without params when none given', async () => {
    await getOrders()
    expect(get).toHaveBeenCalledWith('/orders', { params: undefined })
  })

  it('getOrders forwards filter params unchanged', async () => {
    const params = { status: 'SCHEDULED', view: 'delayed', fromDate: '2026-05-01' }
    await getOrders(params)
    expect(get).toHaveBeenCalledWith('/orders', { params })
  })

  it('getOrderStats calls GET /orders/stats', async () => {
    await getOrderStats()
    expect(get).toHaveBeenCalledWith('/orders/stats')
  })

  it('getOrder builds a per-id URL', async () => {
    await getOrder('WO-20260526-ABCDEF12')
    expect(get).toHaveBeenCalledWith('/orders/WO-20260526-ABCDEF12')
  })

  it('getOrderSlots builds the slots subresource URL for the given id', async () => {
    await getOrderSlots('o-42')
    expect(get).toHaveBeenCalledWith('/orders/o-42/slots')
  })

  it('getOrderHistory builds the history subresource URL for the given id', async () => {
    await getOrderHistory('o-99')
    expect(get).toHaveBeenCalledWith('/orders/o-99/history')
  })

  it('createOrder POSTs the body to /orders', async () => {
    const payload = { customerId: 'c1', quantity: 100 }
    await createOrder(payload)
    expect(post).toHaveBeenCalledWith('/orders', payload)
  })

  it('updateOrder PUTs to the correct id and forwards the body', async () => {
    const body = { quantity: 300, customerDueDate: '2026-06-01' }
    await updateOrder('o-1', body)
    expect(put).toHaveBeenCalledWith('/orders/o-1', body)
    // sanity: 不可誤打到別的 id 或 path
    expect(put).not.toHaveBeenCalledWith('/orders/o-2', body)
  })

  it('cancelOrder DELETEs the given id', async () => {
    await cancelOrder('o-1')
    expect(del).toHaveBeenCalledWith('/orders/o-1')
  })

  it('triggerRescheduleAll POSTs to /scheduling/reschedule-all with no body', async () => {
    await triggerRescheduleAll()
    expect(post).toHaveBeenCalledWith('/scheduling/reschedule-all')
  })

  // ── 錯誤傳播 ─────────────────────────────────────────────────────────────
  // 呼叫端會根據 err.response.status 來決定 toast 訊息，
  // 因此 reject 必須原封不動向上拋。

  it('propagates server errors from updateOrder (e.g. 409 conflict)', async () => {
    const err = new Error('conflict')
    err.response = { status: 409, data: { message: '訂單已被他人修改' } }
    put.mockRejectedValueOnce(err)

    await expect(updateOrder('o-1', { quantity: 100 })).rejects.toBe(err)
  })

  it('propagates server errors from createOrder (e.g. 400 validation)', async () => {
    const err = new Error('bad')
    err.response = { status: 400, data: { message: '數量必須在 25 到 2500 之間' } }
    post.mockRejectedValueOnce(err)

    await expect(createOrder({ quantity: 1 })).rejects.toBe(err)
  })

  it('propagates 404 from cancelOrder', async () => {
    const err = new Error('not found')
    err.response = { status: 404 }
    del.mockRejectedValueOnce(err)

    await expect(cancelOrder('ghost')).rejects.toBe(err)
  })
})
