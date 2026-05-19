import { useCallback, useEffect, useMemo, useState } from 'react'
import { getOrder, updateOrder } from '../api/orderApi'
import {
  QTY_MIN,
  QTY_MAX,
  LEAD_TIME_WEEKS_MIN,
  LEAD_TIME_WEEKS_MAX,
} from '../data/customers'
import useI18n from '../i18n/useI18n'

const MS_PER_DAY = 86_400_000
const CURRENT_USER = 'e.chen@fab2'
const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 30_000

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForScheduling(orderId) {
  const started = Date.now()
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    await wait(POLL_INTERVAL_MS)
    try {
      const { data } = await getOrder(orderId)
      if (data?.status && data.status !== 'PENDING') return data
    } catch {
      // ignore transient errors
    }
  }
  return null
}

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

function mapOrder(o) {
  return {
    id: o.id,
    customerCode: o.customerCode ?? '',
    customerName: o.customerName ?? '',
    qty: o.quantity,
    status: o.status,
    dueDate: o.customerDueDate ?? null,
    expected: o.expectedDueDate ?? null,
    delayedDays: o.delayDays ?? 0,
    scheduleWarning: o.scheduleWarning ?? null,
    createdAt: o.createdAt ?? null,
    lastEditAt: o.updatedAt ? new Date(o.updatedAt) : null,
    lastEditBy: CURRENT_USER,
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
  const [conflicted, setConflicted] = useState(false)
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
      setLoading(true)
      try {
        const { data } = await getOrder(orderId)
        if (cancelled) return
        applyOrder(mapOrder(data))
      } catch {
        // leave loading spinner visible; user can navigate back
      } finally {
        if (!cancelled) setLoading(false)
      }
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

  const reload = useCallback(async () => {
    setReloading(true)
    try {
      const { data } = await getOrder(orderId)
      applyOrder(mapOrder(data))
    } finally {
      setReloading(false)
    }
  }, [orderId, applyOrder])

  const submit = useCallback(async () => {
    if (!canSubmit) return null
    setSubmitting(true)
    try {
      await updateOrder(order.id, {
        quantity: Number(String(qty).replace(/,/g, '')),
        customerDueDate: toISO(dueDate),
      })
      const scheduled = await waitForScheduling(order.id)
      if (!scheduled) return { status: 'ok' }
      if (scheduled.isDelayed) {
        return {
          status: 'delay',
          delayDays: scheduled.delayDays ?? 0,
          earliest: scheduled.expectedDueDate
            ? new Date(`${scheduled.expectedDueDate}T00:00:00`)
            : null,
          scheduleWarning: scheduled.scheduleWarning,
        }
      }
      return { status: 'ok' }
    } catch (err) {
      if (err?.response?.status === 409) {
        setConflicted(true)
        return null
      }
      const message = err?.response?.data?.message ?? err?.message ?? '更新訂單失敗'
      throw new Error(message)
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, order, qty, dueDate])

  const clearConflict = useCallback(() => setConflicted(false), [])

  const reloadAndClearConflict = useCallback(async () => {
    setConflicted(false)
    await reload()
  }, [reload])

  const submitWithAcceptedDate = useCallback(async () => {
    // 延遲已在 submit() 寫入後端，使用者確認時只需重新 fetch 最新資料
    await reload()
  }, [reload])

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
    conflicted,
    clearConflict,
    reloadAndClearConflict,
    currentUser: CURRENT_USER,
  }

}
