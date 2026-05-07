import { useCallback, useEffect, useMemo, useState } from 'react'
import { sampleOrders } from '../data/sampleOrders'
import {
  QTY_MIN,
  QTY_MAX,
  LEAD_TIME_WEEKS_MIN,
  LEAD_TIME_WEEKS_MAX,
} from '../data/customers'
import useI18n from '../i18n/useI18n'

const MS_PER_DAY = 86_400_000
const CURRENT_USER = 'e.chen@fab2'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function parseISO(iso) {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function toISO(d) {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysFromToday(date) {
  if (!date) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date - today) / MS_PER_DAY)
}

function loadMockOrder(orderId) {
  const base =
    sampleOrders.find((o) => o.id === orderId) ?? sampleOrders[0]
  return {
    ...base,
    createdAt: '2024-10-12',
    lastEditAt: new Date(Date.now() - 2 * 60 * 1000),
    lastEditBy: 'm.tanaka@fab2',
  }
}

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
  return {
    ok: false,
    delayDays,
    earliest,
    conflictingOrders,
    scheduleWarning: t.scheduleAlert.defaultWarning(conflictingOrders),
  }
}

export default function useEditOrder(orderId) {
  const { t } = useI18n()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState('')
  const [dueDate, setDueDate] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [initial, setInitial] = useState({ qty: '', dueIso: '' })

  const applyOrder = useCallback((next) => {
    const qtyStr = String(next.qty)
    const due = parseISO(next.dueDate)
    setOrder(next)
    setQty(qtyStr)
    setDueDate(due)
    setInitial({ qty: qtyStr, dueIso: toISO(due) })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await wait(200)
      if (cancelled) return
      applyOrder(loadMockOrder(orderId))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [orderId, applyOrder])

  const stale = useMemo(() => {
    if (!order?.lastEditBy) return false
    return order.lastEditBy !== CURRENT_USER
  }, [order])

  const qtyError = useMemo(() => {
    if (qty === '' || qty == null) return t.editOrder.qtyRequired
    const n = Number(String(qty).replace(/,/g, ''))
    if (!Number.isFinite(n)) return t.quantity.invalidNumber
    if (n < QTY_MIN) return t.quantity.belowMin(QTY_MIN, QTY_MAX)
    if (n > QTY_MAX) return t.quantity.aboveMax(QTY_MIN, QTY_MAX)
    return null
  }, [qty, t])

  const dueMeta = useMemo(() => {
    if (!dueDate) return ''
    const days = daysFromToday(dueDate)
    if (days <= 0) return t.datePicker.todayLabel
    return t.datePicker.daysOut(days)
  }, [dueDate, t])

  const dirty = useMemo(() => {
    if (!order) return false
    if (String(qty) !== initial.qty) return true
    if (toISO(dueDate) !== initial.dueIso) return true
    return false
  }, [order, qty, dueDate, initial])

  const canSubmit = useMemo(() => {
    if (!order || stale || submitting || reloading) return false
    if (!dirty) return false
    if (qtyError) return false
    if (!dueDate) return false
    return true
  }, [order, stale, submitting, reloading, dirty, qtyError, dueDate])

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

  const buildPayload = useCallback(
    (effectiveDate) => ({
      id: order?.id,
      qty: Number(String(qty).replace(/,/g, '')),
      requestedDueDate: toISO(dueDate),
      expectedDate: toISO(effectiveDate ?? dueDate),
    }),
    [order, qty, dueDate],
  )

  const reload = useCallback(async () => {
    setReloading(true)
    await wait(400)
    const fresh = loadMockOrder(orderId)
    applyOrder({ ...fresh, lastEditBy: CURRENT_USER })
    setReloading(false)
  }, [orderId, applyOrder])

  const submit = useCallback(async () => {
    if (!canSubmit) return null
    setSubmitting(true)
    await wait(700)
    const numericQty = Number(String(qty).replace(/,/g, ''))
    const result = mockCapacityCheck({ qty: numericQty, dueDate, t })
    setSubmitting(false)
    if (result.ok) return { status: 'ok', payload: buildPayload(dueDate) }
    return { status: 'delay', ...result }
  }, [canSubmit, qty, dueDate, buildPayload, t])

  const submitWithAcceptedDate = useCallback(
    async (acceptedDate) => {
      setSubmitting(true)
      await wait(500)
      const payload = buildPayload(acceptedDate)
      setSubmitting(false)
      return payload
    },
    [buildPayload],
  )

  return {
    order,
    loading,
    stale,

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

    dirty,
    canSubmit,
    submitting,
    reloading,

    reload,
    submit,
    submitWithAcceptedDate,
    currentUser: CURRENT_USER,
  }
}
