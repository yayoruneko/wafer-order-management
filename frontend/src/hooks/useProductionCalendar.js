import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/orderApi'
import {
  DAILY_CAPACITY,
  FACTORIES,
} from '../data/productionCalendar'

export const CAPACITY_THRESHOLDS = {
  full: DAILY_CAPACITY,
  nearFull: 8000,
  highLoad: 9000,
}

export function classifyCapacity(count) {
  if (count >= CAPACITY_THRESHOLDS.full) return 'full'
  if (count >= CAPACITY_THRESHOLDS.nearFull) return 'nearFull'
  return 'normal'
}

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfMondayWeek(d) {
  const x = new Date(d)
  const dow = x.getDay()
  const diff = (dow + 6) % 7
  x.setDate(x.getDate() - diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function buildMonthGrid(monthStart) {
  const start = startOfMondayWeek(monthStart)
  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push(d)
  }
  return cells
}

export default function useProductionCalendar({ initialDate, today } = {}) {
  const todayDate = useMemo(() => {
    const d = today ? new Date(today) : new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [today])

  const [monthAnchor, setMonthAnchor] = useState(() =>
    startOfMonth(initialDate ?? todayDate),
  )
  const [factoryId, setFactoryId] = useState(FACTORIES[0].id)
  const [selectedISO, setSelectedISO] = useState(null)
  const [calendarData, setCalendarData] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const yearMonth = `${monthAnchor.getFullYear()}-${String(monthAnchor.getMonth() + 1).padStart(2, '0')}`
    api.get('/production/slots', { params: { factoryId, yearMonth } })
      .then(({ data }) => setCalendarData(data))
      .catch(() => setCalendarData({}))
  }, [factoryId, monthAnchor, refreshKey])

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const factoryData = calendarData

  const cells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor])

  const monthGrid = useMemo(() => {
    const monthIdx = monthAnchor.getMonth()
    const todayISO = toISO(todayDate)
    return cells.map((date) => {
      const iso = toISO(date)
      const entry = factoryData[iso]
      const count = entry?.count ?? 0
      const orders = entry?.orders ?? []
      const delayedOrders = orders.filter((o) => o.isDelayed)
      return {
        iso,
        date,
        day: date.getDate(),
        inMonth: date.getMonth() === monthIdx,
        isToday: iso === todayISO,
        isPast: date < todayDate,
        count,
        capacity: DAILY_CAPACITY,
        utilization: count / DAILY_CAPACITY,
        load: classifyCapacity(count),
        orders,
        delayedOrders,
        hasDelay: delayedOrders.length > 0,
        hasOrders: orders.length > 0,
      }
    })
  }, [cells, factoryData, monthAnchor, todayDate])

  const monthSummary = useMemo(() => {
    const monthDays = monthGrid.filter((c) => c.inMonth && c.count > 0)
    if (monthDays.length === 0) {
      return {
        avgUtilization: 0,
        deltaVsPrev: 0,
        fullDays: [],
        nearFullDays: [],
        delayedOrders: [],
      }
    }
    const totalUtil = monthDays.reduce((acc, c) => acc + c.utilization, 0)
    const fullDays = monthDays.filter((c) => c.load === 'full')
    const nearFullDays = monthDays.filter(
      (c) => c.count >= CAPACITY_THRESHOLDS.highLoad && c.load !== 'full',
    )
    const delayedOrders = monthDays.flatMap((c) =>
      c.delayedOrders.map((order) => ({ ...order, dayISO: c.iso })),
    )
    return {
      avgUtilization: totalUtil / monthDays.length,
      deltaVsPrev: 0,
      fullDays,
      nearFullDays,
      delayedOrders,
    }
  }, [monthGrid, factoryId])

  const selectedDay = useMemo(() => {
    if (!selectedISO) return null
    return monthGrid.find((c) => c.iso === selectedISO) ?? null
  }, [monthGrid, selectedISO])

  const goToPrevMonth = useCallback(() => {
    setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }, [])

  const goToNextMonth = useCallback(() => {
    setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }, [])

  const goToToday = useCallback(() => {
    setMonthAnchor(startOfMonth(todayDate))
  }, [todayDate])

  const openDay = useCallback(
    (iso) => {
      const cell = monthGrid.find((c) => c.iso === iso)
      if (!cell || !cell.hasOrders) return
      setSelectedISO(iso)
    },
    [monthGrid],
  )

  const closeDay = useCallback(() => setSelectedISO(null), [])

  return {
    monthAnchor,
    monthGrid,
    monthSummary,
    factories: FACTORIES,
    factoryId,
    setFactoryId,
    selectedDay,
    openDay,
    closeDay,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    refresh,
  }
}
