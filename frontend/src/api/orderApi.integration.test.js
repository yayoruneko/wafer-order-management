import { beforeAll, describe, expect, it } from 'vitest'
import axios from 'axios'
import {
  api,
  cancelOrder,
  createOrder,
  getOrder,
  getOrderSlots,
  getOrders,
  updateOrder,
} from './orderApi'

function toIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

beforeAll(async () => {
  const resp = await axios.post(`${API_BASE}/auth/login`, {
    username: 'admin',
    password: 'password',
  })
  // tokenStorage uses window which doesn't exist in the node test env,
  // so set the bearer token directly on the shared axios instance.
  api.defaults.headers.common['Authorization'] = `Bearer ${resp.data.accessToken}`
})

describe('orderApi ↔ backend integration', () => {
  it('creates an order and then lists it', async () => {
    const due = new Date()
    due.setDate(due.getDate() + 7)

    const payload = {
      factoryId: 'factory-001',
      waferTypeId: 'wafer-type-001',
      customerId: 'customer-001',
      quantity: 125,
      customerDueDate: toIsoDate(due),
    }

    const created = await createOrder(payload).then((r) => r.data)
    expect(created).toBeTruthy()
    expect(created.id).toBeTruthy()
    expect(created.status).toBe('PENDING')
    expect(created.quantity).toBe(125)

    const list = await getOrders().then((r) => r.data)
    expect(Array.isArray(list)).toBe(true)
    expect(list.some((o) => o.id === created.id)).toBe(true)
  })

  it('cancels an order', async () => {
    const due = new Date()
    due.setDate(due.getDate() + 7)

    const payload = {
      factoryId: 'factory-001',
      waferTypeId: 'wafer-type-001',
      customerId: 'customer-002',
      quantity: 50,
      customerDueDate: toIsoDate(due),
    }

    const created = await createOrder(payload).then((r) => r.data)
    expect(created?.id).toBeTruthy()

    await cancelOrder(created.id)

    const after = await getOrders().then((r) => r.data)
    const cancelled = after.find((o) => o.id === created.id)
    expect(cancelled).toBeTruthy()
    expect(cancelled.status).toBe('CANCELLED')
  })

  // ── 跨語言契約測試 ────────────────────────────────────────────────────────
  // 這四個測試專門針對「只有把 frontend+backend 接起來才會炸」的 bug，
  // 避免重複 backend WebMvc 已經覆蓋的東西。

  it('round-trips updatedAt for optimistic locking (409 path)', async () => {
    // 契約：updateOrder 必須能用 backend 回給我們的 updatedAt 字串
    // 重新送回去；否則 LocalDateTime ↔ JS string 的序列化不對齊會讓 409
    // 永遠誤觸發或永遠沉默。
    const due = new Date()
    due.setDate(due.getDate() + 7)

    const created = await createOrder({
      factoryId: 'factory-001',
      waferTypeId: 'wafer-type-001',
      customerId: 'customer-001',
      quantity: 100,
      customerDueDate: toIsoDate(due),
    }).then((r) => r.data)

    // 等 QueuePoller 把它跑成 SCHEDULED，撈到「真正」的 updatedAt
    const scheduled = await waitForOrder(created.id, (o) => o.status === 'SCHEDULED')
    expect(scheduled.updatedAt).toBeTruthy()

    // 故意送一個過期的 updatedAt → 應該收到 409
    const newDue = new Date()
    newDue.setDate(newDue.getDate() + 14)

    let conflict
    try {
      await updateOrder(created.id, {
        quantity: 150,
        customerDueDate: toIsoDate(newDue),
        updatedAt: '2020-01-01T00:00:00',
      })
    } catch (err) {
      conflict = err
    }
    expect(conflict?.response?.status).toBe(409)

    // 用 backend 剛剛回的 updatedAt（原封不動）就能成功
    const ok = await updateOrder(created.id, {
      quantity: 150,
      customerDueDate: toIsoDate(newDue),
      updatedAt: scheduled.updatedAt,
    })
    expect(ok.status).toBe(200)
  })

  it('accepts customerDueDate as a plain YYYY-MM-DD string', async () => {
    // 契約：前端送 ISO date string（不是 datetime、不是 Date 物件序列化），
    // backend 的 LocalDate deserializer 必須吃。任何一邊改格式都會炸 400。
    const due = new Date()
    due.setDate(due.getDate() + 10)
    const iso = toIsoDate(due)
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const created = await createOrder({
      factoryId: 'factory-001',
      waferTypeId: 'wafer-type-001',
      customerId: 'customer-001',
      quantity: 100,
      customerDueDate: iso,
    }).then((r) => r.data)

    // 回來的 customerDueDate 也必須是同樣可解析的 ISO date 格式
    expect(created.customerDueDate).toBe(iso)
  })

  it('eventually transitions a new order to SCHEDULED with slots', async () => {
    // 真正的跨層行為：POST 立即回 PENDING，但 QueuePoller 會把它排成 SCHEDULED
    // 並寫出 ProductionSlot。沒有 frontend+backend+DB 一起跑，這條路徑無法驗證。
    const due = new Date()
    due.setDate(due.getDate() + 14)

    const created = await createOrder({
      factoryId: 'factory-001',
      waferTypeId: 'wafer-type-001',
      customerId: 'customer-001',
      quantity: 200,
      customerDueDate: toIsoDate(due),
    }).then((r) => r.data)

    expect(created.status).toBe('PENDING')

    const scheduled = await waitForOrder(created.id, (o) => o.status === 'SCHEDULED')
    expect(scheduled.remainingQuantity).toBe(0)
    expect(scheduled.lastSlotDate).toBeTruthy()

    const slots = await getOrderSlots(created.id).then((r) => r.data)
    expect(slots.length).toBeGreaterThan(0)
    // 規則：slot 日不可早於今天（cursor 從明天起算）
    const today = toIsoDate(new Date())
    expect(slots.every((s) => s.slotDate > today)).toBe(true)
    expect(slots.reduce((sum, s) => sum + s.quantity, 0)).toBe(200)
  })

  it('returns errors in the ApiResponse {status,message} envelope', async () => {
    // 契約：所有錯誤都應該以 { status, message } 形式回，前端 toast 才能讀 message。
    // 任何一邊把錯誤改成裸字串、純 stack 或別的 key，UI 都會壞掉。
    const due = new Date()
    due.setDate(due.getDate() + 7)

    let err
    try {
      await createOrder({
        factoryId: 'factory-001',
        waferTypeId: 'wafer-type-001',
        customerId: 'customer-001',
        quantity: 10, // 低於下限 25，觸發 400
        customerDueDate: toIsoDate(due),
      })
    } catch (e) {
      err = e
    }

    expect(err?.response?.status).toBe(400)
    expect(err.response.data).toBeTypeOf('object')
    expect(typeof err.response.data.message).toBe('string')
    expect(err.response.data.message.length).toBeGreaterThan(0)
  })
})

// 等到 predicate 為 true 或逾時。QueuePoller fixedDelay=500ms，給 8 秒上限。
async function waitForOrder(id, predicate, { timeoutMs = 8000, intervalMs = 250 } = {}) {
  const deadline = Date.now() + timeoutMs
  let latest
  while (Date.now() < deadline) {
    latest = await getOrder(id).then((r) => r.data)
    if (predicate(latest)) return latest
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(
    `Order ${id} never satisfied predicate within ${timeoutMs}ms; last seen: ${JSON.stringify(latest)}`,
  )
}
