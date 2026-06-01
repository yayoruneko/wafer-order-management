import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../i18n/useI18n', () => ({
  default: () => ({
    t: {
      calendar: {
        stats: {
          avgUtilization: 'Avg utilization',
          fullDays: 'Full days',
          nearFullDays: 'Near-full days',
          nearFullHint: '90% or more',
          delayedOrders: 'Delayed',
          actionNeeded: 'Action needed',
          noAction: 'On track',
          flatVsPrev: 'flat',
          deltaVsPrev: (d) => (d > 0 ? `+${d}%` : `${d}%`),
        },
      },
    },
  }),
}))

vi.mock('../../styles/calendarStyles', () => ({
  calendarStyles: new Proxy({}, { get: () => '' }),
}))

import CalendarStats from './CalendarStats'

function buildSummary(over = {}) {
  return {
    avgUtilization: 0.62,
    deltaVsPrev: 0,
    fullDays: [],
    nearFullDays: [],
    delayedOrders: [],
    ...over,
  }
}

describe('CalendarStats', () => {
  it('renders utilization as a rounded percentage', () => {
    render(<CalendarStats summary={buildSummary({ avgUtilization: 0.625 })} />)
    expect(screen.getByText('63%')).toBeInTheDocument()
  })

  it('renders "flat" when delta=0, signed delta otherwise', () => {
    const { rerender } = render(
      <CalendarStats summary={buildSummary({ deltaVsPrev: 0 })} />,
    )
    expect(screen.getByText('flat')).toBeInTheDocument()

    rerender(<CalendarStats summary={buildSummary({ deltaVsPrev: 5 })} />)
    expect(screen.getByText('+5%')).toBeInTheDocument()
  })

  it('counts full / near-full / delayed', () => {
    render(
      <CalendarStats
        summary={buildSummary({
          fullDays: [{}, {}, {}],
          nearFullDays: [{}, {}],
          delayedOrders: [{}],
        })}
      />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows action-needed copy only when there are delayed orders', () => {
    const { rerender } = render(
      <CalendarStats summary={buildSummary({ delayedOrders: [] })} />,
    )
    expect(screen.getByText('On track')).toBeInTheDocument()

    rerender(<CalendarStats summary={buildSummary({ delayedOrders: [{}] })} />)
    expect(screen.getByText('Action needed')).toBeInTheDocument()
  })
})
