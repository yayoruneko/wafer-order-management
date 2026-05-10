import { describe, expect, it } from 'vitest'
import { cancelOrder, createOrder, getOrders } from './orderApi'

function toIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('orderApi ↔ backend integration', () => {
  it('creates an order and then lists it', async () => {
    const due = new Date()
    due.setDate(due.getDate() + 7)

    const payload = {
      factoryId: 'FAB-IT',
      waferTypeId: 'WT-IT',
      customerId: `CUST-IT-${Date.now()}`,
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
      factoryId: 'FAB-IT',
      waferTypeId: 'WT-IT',
      customerId: `CUST-IT-${Date.now()}`,
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
