import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../i18n/useI18n', () => ({
  default: () => ({
    t: {
      locale: 'en-US',
      calendar: {
        dayCell: {
          today: 'today',
          viewHint: 'View day',
          atCapacity: 'Full',
          delayedTag: (n) => `${n} delayed`,
          ariaOrders: (iso, n) => `${iso}: ${n} orders`,
          ariaOrdersDelayed: (iso, n, d) => `${iso}: ${n} orders, ${d} delayed`,
        },
      },
    },
  }),
}))

// Style modules pull tailwind classnames; just make them resolvable.
vi.mock('../../styles/calendarStyles', () => ({
  calendarStyles: new Proxy({}, { get: () => '' }),
  loadStyles: {
    normal: { cellBg: '', cellOuter: '', countText: '', bar: '', barDim: '' },
    nearFull: { cellBg: '', cellOuter: '', countText: '', bar: '', barDim: '' },
    full: { cellBg: '', cellOuter: '', countText: '', bar: '', barDim: '' },
  },
}))

import CalendarDayCell from './CalendarDayCell'

function buildCell(over = {}) {
  return {
    iso: '2026-06-15',
    day: 15,
    inMonth: true,
    isToday: false,
    count: 5000,
    capacity: 10000,
    utilization: 0.5,
    load: 'normal',
    orders: [{ id: 'a' }],
    delayedOrders: [],
    hasDelay: false,
    hasOrders: true,
    ...over,
  }
}

/**
 * Calendar day cell is the most-displayed visual unit on the calendar page.
 *  - 不在當月的格子要 muted、不可點
 *  - 沒有訂單的格子不可點（即使在當月）
 *  - 滿載/延誤要顯示對應 tag 與 alert icon
 *  - 點擊與 Enter / Space 都會觸發 onOpen，但只在 hasOrders=true 時
 *  - 今天的格子要顯示 today pill
 */
describe('CalendarDayCell', () => {
  it('renders the day number and count/capacity', () => {
    render(<CalendarDayCell cell={buildCell()} onOpen={vi.fn()} />)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/5,000/)).toBeInTheDocument()
    expect(screen.getByText(/10,000/)).toBeInTheDocument()
  })

  it('is clickable when hasOrders=true and calls onOpen with iso', () => {
    const onOpen = vi.fn()
    render(<CalendarDayCell cell={buildCell()} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalledWith('2026-06-15')
  })

  it('is NOT clickable (no role=button) when hasOrders=false', () => {
    const onOpen = vi.fn()
    render(
      <CalendarDayCell
        cell={buildCell({ hasOrders: false, orders: [] })}
        onOpen={onOpen}
      />,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('Enter / Space on a clickable cell also opens it', () => {
    const onOpen = vi.fn()
    render(<CalendarDayCell cell={buildCell()} onOpen={onOpen} />)
    const btn = screen.getByRole('button')
    fireEvent.keyDown(btn, { key: 'Enter' })
    fireEvent.keyDown(btn, { key: ' ' })
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('shows "today" pill when isToday=true', () => {
    render(
      <CalendarDayCell cell={buildCell({ isToday: true })} onOpen={vi.fn()} />,
    )
    expect(screen.getByText('today')).toBeInTheDocument()
  })

  it('shows "Full" tag when load=full and no delay', () => {
    render(
      <CalendarDayCell
        cell={buildCell({ load: 'full', count: 10000, utilization: 1.0 })}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('Full')).toBeInTheDocument()
  })

  it('shows "N delayed" tag when load=full and hasDelay=true', () => {
    render(
      <CalendarDayCell
        cell={buildCell({
          load: 'full',
          count: 10000,
          utilization: 1.0,
          hasDelay: true,
          delayedOrders: [{ id: 'd1' }, { id: 'd2' }],
        })}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('2 delayed')).toBeInTheDocument()
  })

  it('aria-label distinguishes ordinary days from delayed days', () => {
    const { rerender } = render(
      <CalendarDayCell cell={buildCell()} onOpen={vi.fn()} />,
    )
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe(
      '2026-06-15: 1 orders',
    )

    rerender(
      <CalendarDayCell
        cell={buildCell({
          hasDelay: true,
          delayedOrders: [{ id: 'd1' }],
        })}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe(
      '2026-06-15: 1 orders, 1 delayed',
    )
  })

  it('cells outside the current month are visually muted (not in role=button)', () => {
    render(
      <CalendarDayCell
        cell={buildCell({ inMonth: false, hasOrders: false })}
        onOpen={vi.fn()}
      />,
    )
    // muted out-of-month cells aren't interactive even if they had orders
    expect(screen.queryByRole('button')).toBeNull()
  })
})
