import { beforeAll, describe, expect, it } from 'vitest'
import axios from 'axios'
import { cancelOrder, createOrder, getOrders, api } from './orderApi'

function toIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// VITE_API_URL = "http://localhost:8080/api"; auth lives at the server root
const SERVER_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '')

beforeAll(async () => {
  const resp = await axios.post(`${SERVER_BASE}/auth/login`, {
    username: 'test.admin',
    password: 'Test1234!',
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
})
