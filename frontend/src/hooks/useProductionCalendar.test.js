import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/orderApi', () => ({
  api: { get: vi.fn() },
}))

vi.mock('../data/productionCalendar', () => ({
  DAILY_CAPACITY: 10_000,
  FACTORIES: [
    { id: 'factory-001', label: 'Fab 1' },
    { id: 'factory-002', label: 'Fab 2' },
  ],
}))

import useProductionCalendar, { classifyCapacity, CAPACITY_THRESHOLDS } from './useProductionCalendar'
import { api } from '../api/orderApi'

beforeEach(() => {
  api.get.mockResolvedValue({ data: {} })
})

/**
 * useProductionCalendar 是 CalendarPage 的主資料來源：
 *  - classifyCapacity 把產能用量轉成顏色等級
 *  - monthGrid 永遠是 42 格（6 週 × 7 天），含跨月補位
 *  - monthSummary 統計只算「當月內」的天，full / near-full 不互疊
 *  - 月份切換 / 今日 button 會更新 anchor
 *  - openDay 只在該天有訂單時才生效
 */
describe('useProductionCalendar', () => {
  it('classifyCapacity returns the right band', () => {
    expect(classifyCapacity(0)).toBe('normal')
    expect(classifyCapacity(7999)).toBe('normal')
    expect(classifyCapacity(8000)).toBe('nearFull')  // CAPACITY_THRESHOLDS.nearFull
    expect(classifyCapacity(9999)).toBe('nearFull')
    expect(classifyCapacity(10000)).toBe('full')
    expect(CAPACITY_THRESHOLDS.full).toBe(10000)
  })

  it('builds a 42-cell month grid', async () => {
    const { result } = renderHook(() =>
      useProductionCalendar({ today: '2026-06-01', initialDate: new Date(2026, 5, 1) }),
    )
    await waitFor(() => expect(result.current.monthGrid.length).toBe(42))

    // exactly one cell flagged isToday
    expect(result.current.monthGrid.filter((c) => c.isToday).length).toBe(1)
    // contains both in-month and out-of-month days (a 30-day June has both)
    expect(result.current.monthGrid.some((c) => c.inMonth)).toBe(true)
    expect(result.current.monthGrid.some((c) => !c.inMonth)).toBe(true)
  })

  it('classifies day load based on returned counts', async () => {
    // 2026-06-15 fully booked, 06-16 near full, 06-17 light
    api.get.mockResolvedValue({
      data: {
        '2026-06-15': { count: 10000, orders: [{ id: 'a', isDelayed: false }] },
        '2026-06-16': { count: 9500, orders: [{ id: 'b', isDelayed: false }] },
        '2026-06-17': { count: 100, orders: [{ id: 'c', isDelayed: true }] },
      },
    })

    const { result } = renderHook(() =>
      useProductionCalendar({ today: '2026-06-01', initialDate: new Date(2026, 5, 1) }),
    )

    await waitFor(() =>
      expect(result.current.monthGrid.find((c) => c.iso === '2026-06-15')?.count).toBe(10000),
    )

    const full = result.current.monthGrid.find((c) => c.iso === '2026-06-15')
    const near = result.current.monthGrid.find((c) => c.iso === '2026-06-16')
    const light = result.current.monthGrid.find((c) => c.iso === '2026-06-17')

    expect(full.load).toBe('full')
    expect(near.load).toBe('nearFull')
    expect(light.load).toBe('normal')
    expect(light.hasDelay).toBe(true)
  })

  it('monthSummary only counts in-month days', async () => {
    api.get.mockResolvedValue({
      data: {
        '2026-06-15': { count: 10000, orders: [{ id: 'a', isDelayed: false }] },
        // A day from the surrounding-grid week that's NOT in the month
        '2026-05-31': { count: 10000, orders: [{ id: 'x', isDelayed: true }] },
      },
    })
    const { result } = renderHook(() =>
      useProductionCalendar({ today: '2026-06-01', initialDate: new Date(2026, 5, 1) }),
    )

    await waitFor(() => expect(result.current.monthSummary.fullDays.length).toBe(1))
    // The 2026-05-31 entry should be ignored even though it's in the 42-grid
    expect(result.current.monthSummary.fullDays.map((d) => d.iso)).toEqual(['2026-06-15'])
    expect(result.current.monthSummary.delayedOrders.length).toBe(0)
  })

  it('goToNextMonth / goToPrevMonth / goToToday update the anchor', async () => {
    const { result } = renderHook(() =>
      useProductionCalendar({ today: '2026-06-01', initialDate: new Date(2026, 5, 1) }),
    )
    await waitFor(() => expect(result.current.monthAnchor.getMonth()).toBe(5))

    act(() => result.current.goToNextMonth())
    expect(result.current.monthAnchor.getMonth()).toBe(6)

    act(() => result.current.goToPrevMonth())
    expect(result.current.monthAnchor.getMonth()).toBe(5)

    act(() => result.current.goToNextMonth())
    act(() => result.current.goToNextMonth())
    expect(result.current.monthAnchor.getMonth()).toBe(7)

    act(() => result.current.goToToday())
    expect(result.current.monthAnchor.getMonth()).toBe(5)
  })

  it('openDay only opens days that have orders', async () => {
    api.get.mockResolvedValue({
      data: {
        '2026-06-15': { count: 100, orders: [{ id: 'a', isDelayed: false }] },
      },
    })
    const { result } = renderHook(() =>
      useProductionCalendar({ today: '2026-06-01', initialDate: new Date(2026, 5, 1) }),
    )
    await waitFor(() =>
      expect(result.current.monthGrid.find((c) => c.iso === '2026-06-15')?.hasOrders).toBe(true),
    )

    act(() => result.current.openDay('2026-06-15'))
    expect(result.current.selectedDay?.iso).toBe('2026-06-15')

    act(() => result.current.openDay('2026-06-16'))  // no orders
    expect(result.current.selectedDay?.iso).toBe('2026-06-15')  // unchanged

    act(() => result.current.closeDay())
    expect(result.current.selectedDay).toBeNull()
  })

  it('refresh() triggers a new fetch', async () => {
    const { result } = renderHook(() =>
      useProductionCalendar({ today: '2026-06-01', initialDate: new Date(2026, 5, 1) }),
    )
    await waitFor(() => expect(api.get).toHaveBeenCalled())
    const before = api.get.mock.calls.length

    act(() => result.current.refresh())
    await waitFor(() => expect(api.get.mock.calls.length).toBe(before + 1))
  })

  it('changing factoryId triggers a new fetch with the new factory', async () => {
    const { result } = renderHook(() =>
      useProductionCalendar({ today: '2026-06-01', initialDate: new Date(2026, 5, 1) }),
    )
    await waitFor(() => expect(api.get).toHaveBeenCalled())

    act(() => result.current.setFactoryId('factory-002'))
    await waitFor(() => {
      const last = api.get.mock.calls.at(-1)
      expect(last[1].params.factoryId).toBe('factory-002')
    })
  })
})
