import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getOrders, getOrderStats, cancelOrder } from '../api/orderApi'

const CUSTOMER_COLORS = ['#76B900', '#ED1C24', '#0071C5', '#E60012', '#3253DC', '#1428A0', '#FF6B35', '#00B4D8']

function hashColor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return CUSTOMER_COLORS[Math.abs(h) % CUSTOMER_COLORS.length]
}

function mapOrder(o) {
  return {
    id: o.id,
    customerCode: o.customerCode ?? '',
    customerName: o.customerName ?? '',
    customerColor: hashColor(o.customerId ?? o.customerCode ?? ''),
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
  const [statsData, setStatsData] = useState({ total: 0, inProduction: 0, delayed: 0, totalWafers: 0 })
  const [viewCountsData, setViewCountsData] = useState({ all: 0, delayed: 0, in_production: 0, mine: 0 })
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

  // Refs so stable callbacks can always read the latest values
  const filtersRef = useRef(filters)
  const viewRef = useRef(view)
  useEffect(() => { filtersRef.current = filters }, [filters])
  useEffect(() => { viewRef.current = view }, [view])

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await getOrderStats()
      setStatsData({
        total: data.total,
        inProduction: data.inProduction,
        delayed: data.delayed,
        totalWafers: data.totalWafers,
      })
      setViewCountsData({
        all: data.allCount,
        delayed: data.delayedCount,
        in_production: data.inProductionCount,
        mine: data.mineCount,
      })
    } catch {
      // stats failure is non-critical
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const { id, customer, status, dateRange } = filtersRef.current
      const currentView = viewRef.current
      const params = {}
      if (id) params.orderId = id
      if (customer) params.customerName = customer
      if (status && status !== 'ALL') params.status = status
      if (dateRange?.fromIso) params.fromDate = dateRange.fromIso
      if (dateRange?.toIso) params.toDate = dateRange.toIso
      if (currentView && currentView !== 'all') params.view = currentView
      const { data } = await getOrders(params)
      setOrders(data.map(mapOrder))
    } catch {
      setOrders([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Re-fetch whenever filters or view change (fetchOrders is stable)
  useEffect(() => {
    fetchOrders()
  }, [filters, view, fetchOrders])

  const sorted = useMemo(() => {
    if (!sortField) return orders
    const arr = [...orders]
    arr.sort((a, b) => compare(a, b, sortField) * (sortDir === 'asc' ? 1 : -1))
    return arr
  }, [orders, sortField, sortDir])

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
      fetchStats()
    }
  }, [selectedIds, fetchOrders, fetchStats])

  const exportSelected = useCallback(() => {
    const rows = sorted.filter((o) => selectedIds.has(o.id))
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
  }, [sorted, selectedIds])

  const pageAllSelected =
    pageItems.length > 0 && pageItems.every((o) => selectedIds.has(o.id))
  const pageSomeSelected =
    !pageAllSelected && pageItems.some((o) => selectedIds.has(o.id))

  const selectedOrders = useMemo(
    () => sorted.filter((o) => selectedIds.has(o.id)),
    [sorted, selectedIds],
  )

  const retry = useCallback(() => {
    fetchOrders()
    fetchStats()
  }, [fetchOrders, fetchStats])

  return {
    orders: pageItems,
    loading,
    error,
    retry,
    total: statsData.total,
    filteredTotal: sorted.length,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalPages,
    stats: statsData,
    viewCounts: viewCountsData,
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
