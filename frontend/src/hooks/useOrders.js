import { useCallback, useEffect, useMemo, useState } from 'react'
import { getOrders, cancelOrder } from '../api/orderApi'

const CUSTOMER_COLORS = ['#76B900', '#ED1C24', '#0071C5', '#E60012', '#3253DC', '#1428A0', '#FF6B35', '#00B4D8']

function mapOrder(o, index) {
  return {
    id: o.id,
    customerCode: o.customerCode ?? '',
    customerName: o.customerName ?? '',
    customerColor: CUSTOMER_COLORS[index % CUSTOMER_COLORS.length],
    qty: o.quantity,
    status: o.status,
    dueDate: o.customerDueDate ?? null,
    expected: o.expectedDueDate ?? null,
    delayedDays: o.delayDays ?? 0,
    scheduleWarning: o.scheduleWarning ?? null,
    owner: 'me',
  }
}

export const PAGE_SIZE = 20

const EMPTY_DATE_RANGE = { fromIso: '', toIso: '' }

const VIEW_FILTERS = {
  all: () => true,
  delayed: (o) => o.delayedDays > 0 && o.status !== 'CANCELLED',
  in_production: (o) => o.status === 'IN_PRODUCTION',
  mine: (o) => o.owner === 'me',
}

function compare(a, b, field) {
  const av = a[field]
  const bv = b[field]
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  if (typeof av === 'number' && typeof bv === 'number') return av - bv
  return String(av).localeCompare(String(bv))
}

export default function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filters, setFilters] = useState({
    id: '',
    customer: '',
    status: 'ALL',
    dateRange: EMPTY_DATE_RANGE,
  })
  const [view, setView] = useState('all')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const { data } = await getOrders()
      setOrders(data.map(mapOrder))
    } catch {
      setOrders([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const stats = useMemo(() => {
    let inProduction = 0
    let delayed = 0
    let totalWafers = 0
    for (const o of orders) {
      if (o.status === 'IN_PRODUCTION') inProduction += 1
      if (o.delayedDays > 0 && o.status !== 'CANCELLED') delayed += 1
      if (o.status !== 'CANCELLED') totalWafers += o.qty
    }
    return { total: orders.length, inProduction, delayed, totalWafers }
  }, [orders])

  const viewCounts = useMemo(
    () => ({
      all: orders.length,
      delayed: orders.filter(VIEW_FILTERS.delayed).length,
      in_production: orders.filter(VIEW_FILTERS.in_production).length,
      mine: orders.filter(VIEW_FILTERS.mine).length,
    }),
    [orders],
  )

  const filtered = useMemo(() => {
    const { id, customer, status, dateRange } = filters
    const idLower = id.toLowerCase()
    const custLower = customer.toLowerCase()
    const fromIso = dateRange.fromIso || ''
    const toIso = dateRange.toIso || ''
    const viewFn = VIEW_FILTERS[view] ?? VIEW_FILTERS.all
    return orders.filter((o) => {
      if (!viewFn(o)) return false
      if (idLower && !o.id.toLowerCase().includes(idLower)) return false
      if (
        custLower &&
        !`${o.customerName} ${o.customerCode}`
          .toLowerCase()
          .includes(custLower)
      )
        return false
      if (status && status !== 'ALL' && o.status !== status) return false
      if (fromIso || toIso) {
        const due = o.dueDate || ''
        if (!due) return false
        if (fromIso && due < fromIso) return false
        if (toIso && due > toIso) return false
      }
      return true
    })
  }, [orders, filters, view])

  const sorted = useMemo(() => {
    if (!sortField) return filtered
    const arr = [...filtered]
    arr.sort((a, b) => compare(a, b, sortField) * (sortDir === 'asc' ? 1 : -1))
    return arr
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, safePage])

  const search = useCallback((next) => {
    setFilters(next)
    setPage(1)
  }, [])

  const reset = useCallback(() => {
    setFilters({ id: '', customer: '', status: 'ALL', dateRange: EMPTY_DATE_RANGE })
    setPage(1)
  }, [])

  const goPage = useCallback((p) => setPage(p), [])
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const nextPage = useCallback(
    () => setPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  )

  const changeView = useCallback((id) => {
    setView(id)
    setPage(1)
  }, [])

  const toggleSort = useCallback(
    (field) => {
      if (sortField === field) {
        if (sortDir === 'asc') setSortDir('desc')
        else {
          setSortField(null)
          setSortDir('asc')
        }
      } else {
        setSortField(field)
        setSortDir('asc')
      }
      setPage(1)
    },
    [sortField, sortDir],
  )

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = pageItems.every((o) => next.has(o.id))
      if (allSelected) {
        for (const o of pageItems) next.delete(o.id)
      } else {
        for (const o of pageItems) next.add(o.id)
      }
      return next
    })
  }, [pageItems])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const updateOrderField = useCallback((id, updates) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    )
  }, [])

  const cancelSelected = useCallback(async () => {
    const ids = [...selectedIds]
    setOrders((prev) =>
      prev.map((o) => ids.includes(o.id) ? { ...o, status: 'CANCELLED' } : o),
    )
    setSelectedIds(new Set())
    try {
      await Promise.all(ids.map((id) => cancelOrder(id)))
    } finally {
      fetchOrders()
    }
  }, [selectedIds, fetchOrders])

  const exportSelected = useCallback(() => {
    const rows = orders.filter((o) => selectedIds.has(o.id))
    const header = ['Order ID', 'Customer', 'Qty', 'Status', 'Due Date', 'Expected']
    const toCell = (v) => {
      const s = v == null ? '' : String(v)
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const toRow = (cells) => cells.map(toCell).join(',')
    const csv = [
      toRow(header),
      ...rows.map((o) =>
        toRow([
          o.id,
          `${o.customerCode} ${o.customerName}`,
          o.qty,
          o.status,
          o.dueDate ?? '',
          o.expected ?? '',
        ]),
      ),
    ].join('\r\n')
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ts = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`
    a.download = `wafer-orders-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [orders, selectedIds])

  const pageAllSelected =
    pageItems.length > 0 && pageItems.every((o) => selectedIds.has(o.id))
  const pageSomeSelected =
    !pageAllSelected && pageItems.some((o) => selectedIds.has(o.id))

  const selectedOrders = useMemo(
    () => orders.filter((o) => selectedIds.has(o.id)),
    [orders, selectedIds],
  )

  return {
    orders: pageItems,
    loading,
    error,
    retry: fetchOrders,
    total: orders.length,
    filteredTotal: filtered.length,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalPages,
    stats,
    viewCounts,
    view,
    changeView,
    sortField,
    sortDir,
    toggleSort,
    selectedIds,
    selectedOrders,
    selectedCount: selectedIds.size,
    pageAllSelected,
    pageSomeSelected,
    toggleSelect,
    toggleSelectAllOnPage,
    clearSelection,
    cancelSelected,
    exportSelected,
    updateOrderField,
    search,
    reset,
    goPage,
    prevPage,
    nextPage,
  }
}
