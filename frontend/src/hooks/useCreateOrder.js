import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  QTY_MIN,
  QTY_MAX,
  LEAD_TIME_WEEKS_MIN,
  LEAD_TIME_WEEKS_MAX,
} from '../data/customers'
import { PRESET_COLORS } from '../styles/createOrderStyles'
import useI18n from '../i18n/useI18n'
import { getCustomers, createOrder, getOrder, cancelOrder } from '../api/orderApi'

const HARDCODED_FACTORY_ID = 'factory-001'
const HARDCODED_WAFER_TYPE_ID = 'wafer-type-001'

const MS_PER_DAY = 86_400_000
const POLL_INTERVAL_MS = 1500
// Extended timeout: covers SCHEDULE_ORDER (~5s) + auto-enqueued RESCHEDULE_ALL (~5s) + buffer
const POLL_TIMEOUT_MS = 45_000

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// State machine to wait for the FULL scheduling cycle:
//   PENDING
//   → SCHEDULED(delayed=true)   ← SCHEDULE_ORDER done, but RESCHEDULE_ALL will follow
//   → PENDING                   ← RESCHEDULE_ALL started (reset order)
//   → SCHEDULED(final result)   ← RESCHEDULE_ALL done
//
// Only return on:
//   - SCHEDULED with isDelayed=false (on-time, any point)
//   - SCHEDULED with isDelayed=true AND we already saw the PENDING→SCHEDULED cycle
//   - timeout (return null → caller treats as ok)
async function waitForScheduling(orderId) {
  const started = Date.now()
  let seenDelayed = false          // saw first SCHEDULED + isDelayed=true
  let wentPendingAfterDelay = false  // went back to PENDING after above

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    await wait(POLL_INTERVAL_MS)
    try {
      const { data } = await getOrder(orderId)
      if (!data?.status) continue

      if (data.status === 'PENDING') {
        if (seenDelayed) wentPendingAfterDelay = true
        continue
      }

      // SCHEDULED (or any non-PENDING terminal status)
      if (!data.isDelayed) return data  // on-time: done

      // isDelayed = true
      if (!seenDelayed) {
        // First delayed snapshot: RESCHEDULE_ALL is likely queued, keep waiting
        seenDelayed = true
        continue
      }
      if (wentPendingAfterDelay) {
        // RESCHEDULE_ALL completed (saw PENDING in between) and still delayed → final answer
        return data
      }
      // RESCHEDULE_ALL hasn't started yet → keep polling
    } catch {
      // ignore transient errors
    }
  }
  return null
}

function nextCustomerCode(customers) {
  let max = 0
  for (const c of customers) {
    const n = Number(String(c.code).replace(/\D+/g, ''))
    if (Number.isFinite(n) && n > max) max = n
  }
  return `CUST-${String(max + 1).padStart(3, '0')}`
}

function pickColor(seed) {
  return PRESET_COLORS[seed % PRESET_COLORS.length]
}

function defaultDueDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 6 * 7)
  return d
}

function toISO(d) {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function useCreateOrder() {
  const { t } = useI18n()
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [qty, setQty] = useState('')
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [submitting, setSubmitting] = useState(false)
  const seedRef = useRef(0)

  useEffect(() => {
    getCustomers()
      .then(({ data }) => {
        const mapped = data.map((c, i) => ({
          id: c.id,
          code: c.customerCode,
          name: c.name,
          color: PRESET_COLORS[i % PRESET_COLORS.length],
        }))
        setCustomers(mapped)
        seedRef.current = mapped.length
      })
      .catch(() => {})
  }, [])

  const qtyError = useMemo(() => {
    if (qty === '' || qty == null) return null
    const n = Number(String(qty).replace(/,/g, ''))
    if (!Number.isFinite(n)) return t.quantity.invalidNumber
    if (n < QTY_MIN) return t.quantity.belowMin(QTY_MIN, QTY_MAX)
    if (n > QTY_MAX) return t.quantity.aboveMax(QTY_MIN, QTY_MAX)
    return null
  }, [qty, t])

  const dueMeta = useMemo(() => {
    if (!dueDate) return ''
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Math.round((dueDate - today) / MS_PER_DAY)
    if (days <= 0) return t.datePicker.todayLabel
    const weeks = Math.round(days / 7)
    if (weeks <= 0) return t.datePicker.daysOut(days)
    return t.datePicker.weeksOut(weeks)
  }, [dueDate, t])

  const canSubmit = useMemo(() => {
    if (!selectedCustomer) return false
    if (qty === '' || qtyError) return false
    if (!dueDate) return false
    return true
  }, [selectedCustomer, qty, qtyError, dueDate])

  const selectCustomer = useCallback((c) => setSelectedCustomer(c), [])

  const addCustomer = useCallback(({ name, code }) => {
    const trimmedName = name.trim()
    if (!trimmedName) return null
    const next = {
      name: trimmedName,
      code: code?.trim() || nextCustomerCode(customers),
      color: pickColor(seedRef.current++),
    }
    setCustomers((prev) => [...prev, next])
    setSelectedCustomer(next)
    return next
  }, [customers])

  const updateQty = useCallback((value) => setQty(value), [])

  const stepQty = useCallback((delta) => {
    setQty((prev) => {
      const n = Number(String(prev || 0).replace(/,/g, ''))
      const base = Number.isFinite(n) ? n : 0
      const next = Math.max(0, base + delta)
      return String(next)
    })
  }, [])

  const updateDueDate = useCallback((d) => setDueDate(d), [])

  const reset = useCallback(() => {
    setSelectedCustomer(null)
    setQty('')
    setDueDate(defaultDueDate())
  }, [])

  const buildPayload = useCallback(
    () => ({
      customerId: selectedCustomer?.id ?? null,
      factoryId: HARDCODED_FACTORY_ID,
      waferTypeId: HARDCODED_WAFER_TYPE_ID,
      quantity: Number(String(qty).replace(/,/g, '')),
      customerDueDate: toISO(dueDate),
    }),
    [selectedCustomer, qty, dueDate],
  )

  const submit = useCallback(async () => {
    if (!canSubmit) return null
    setSubmitting(true)
    try {
      const { data: created } = await createOrder(buildPayload())
      const orderId = created?.id
      if (!orderId) return { status: 'ok' }

      const scheduled = await waitForScheduling(orderId)
      if (!scheduled) {
        // Scheduler still pending — treat as success; the row will appear pending in the list
        return { status: 'ok', orderId }
      }
      if (scheduled.isDelayed) {
        return {
          status: 'delayed',
          orderId,
          earliest: scheduled.expectedDueDate,
          delayDays: scheduled.delayDays ?? 0,
          scheduleWarning: scheduled.scheduleWarning,
        }
      }
      return { status: 'ok', orderId }
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? '建立訂單失敗'
      throw new Error(message)
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, buildPayload])

  const cancelCreatedOrder = useCallback(async (orderId) => {
    if (!orderId) return
    try {
      await cancelOrder(orderId)
    } catch {
      // best effort: order may already be in a non-cancellable state
    }
  }, [])

  return {
    customers,
    selectedCustomer,
    selectCustomer,
    addCustomer,

    qty,
    qtyError,
    qtyMin: QTY_MIN,
    qtyMax: QTY_MAX,
    updateQty,
    stepQty,

    dueDate,
    dueMeta,
    updateDueDate,

    leadTime: { min: LEAD_TIME_WEEKS_MIN, max: LEAD_TIME_WEEKS_MAX },

    canSubmit,
    submitting,
    submit,
    cancelCreatedOrder,
    reset,
  }
}
