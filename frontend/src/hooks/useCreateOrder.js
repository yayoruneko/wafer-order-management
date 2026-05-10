import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  QTY_MIN,
  QTY_MAX,
  LEAD_TIME_WEEKS_MIN,
  LEAD_TIME_WEEKS_MAX,
} from '../data/customers'
import { PRESET_COLORS } from '../styles/createOrderStyles'
import useI18n from '../i18n/useI18n'
import { getCustomers, createOrder } from '../api/orderApi'

const HARDCODED_FACTORY_ID = 'factory-001'
const HARDCODED_WAFER_TYPE_ID = 'wafer-type-001'

const MS_PER_DAY = 86_400_000

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function mockCapacityCheck({ qty, dueDate, t }) {
  if (!qty || !dueDate) return { ok: true }
  const dayHash =
    dueDate.getFullYear() * 372 + dueDate.getMonth() * 31 + dueDate.getDate()
  const congestion = (dayHash % 7) + Math.floor(qty / 400)
  if (congestion <= 5) return { ok: true }
  const delayDays = Math.min(30, congestion - 5)
  const earliest = new Date(dueDate)
  earliest.setDate(earliest.getDate() + delayDays)
  const conflictingOrders = (dayHash % 3) + 1
  const scheduleWarning = t.scheduleAlert.defaultWarning(conflictingOrders)
  return { ok: false, delayDays, earliest, conflictingOrders, scheduleWarning }
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

  const checkCapacity = useCallback(() => {
    if (!canSubmit) return null
    const numericQty = Number(String(qty).replace(/,/g, ''))
    return mockCapacityCheck({ qty: numericQty, dueDate, t })
  }, [canSubmit, qty, dueDate, t])

  const submit = useCallback(async () => {
    if (!canSubmit) return null
    setSubmitting(true)
    try {
      await createOrder(buildPayload())
      return { status: 'ok' }
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? '建立訂單失敗'
      throw new Error(message)
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, buildPayload])

  const submitWithAcceptedDate = useCallback(
    async () => {
      if (!canSubmit) return null
      setSubmitting(true)
      try {
        await createOrder(buildPayload())
        return { status: 'ok' }
      } finally {
        setSubmitting(false)
      }
    },
    [canSubmit, buildPayload],
  )

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
    submitWithAcceptedDate,
    checkCapacity,
    reset,
  }
}
