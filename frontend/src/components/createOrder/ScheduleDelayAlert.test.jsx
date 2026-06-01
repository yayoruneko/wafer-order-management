import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ScheduleDelayAlert from './ScheduleDelayAlert'

vi.mock('../../i18n/useI18n', () => ({
  default: () => ({
    formatDate: (d) =>
      d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '—'),
    t: {
      scheduleAlert: {
        title: 'Delay notice',
        subtitle: 'Capacity full',
        body: 'Earliest date calculated.',
        requestedDate: 'Requested',
        earliestDate: 'Earliest',
        delayPill: (d) => `+${d}d`,
        defaultWarning: (n) => `${n} other orders affect this window`,
        cancel: 'Cancel order',
        accept: 'Accept new date',
        cancelling: 'Cancelling…',
        accepting: 'Working…',
      },
    },
  }),
}))

/**
 * §1.5 / §2.2 modal contract. The hook decides outcome; the modal:
 *  - shows requested vs earliest dates so the user can choose
 *  - wires confirm / cancel to the callbacks the page hooks pass in
 *  - blocks input while a decision is in flight
 *  - is not in the DOM when `open=false`
 */
describe('ScheduleDelayAlert', () => {
  const baseProps = {
    open: true,
    requestedDate: new Date('2026-06-15'),
    earliestDate: new Date('2026-06-19'),
    delayDays: 4,
    conflictingOrders: 3,
    onCancel: vi.fn(),
    onAccept: vi.fn(),
  }

  it('does not render when open=false', () => {
    render(<ScheduleDelayAlert {...baseProps} open={false} />)
    expect(screen.queryByText('Delay notice')).toBeNull()
  })

  it('shows requested date, earliest date, and delay days side-by-side', () => {
    render(<ScheduleDelayAlert {...baseProps} />)

    expect(screen.getByText('Requested')).toBeInTheDocument()
    expect(screen.getByText('2026-06-15')).toBeInTheDocument()
    expect(screen.getByText('Earliest')).toBeInTheDocument()
    expect(screen.getByText('2026-06-19')).toBeInTheDocument()
    expect(screen.getByText('+4d')).toBeInTheDocument()
  })

  it('renders defaultWarning when scheduleWarning prop is omitted', () => {
    render(<ScheduleDelayAlert {...baseProps} />)
    expect(screen.getByText(/3 other orders/)).toBeInTheDocument()
  })

  it('renders server-supplied scheduleWarning when provided', () => {
    render(
      <ScheduleDelayAlert
        {...baseProps}
        scheduleWarning="90 天內總產能不足"
      />,
    )
    expect(screen.getByText('90 天內總產能不足')).toBeInTheDocument()
  })

  it('wires confirm button to onAccept', () => {
    const onAccept = vi.fn()
    render(<ScheduleDelayAlert {...baseProps} onAccept={onAccept} />)
    fireEvent.click(screen.getByRole('button', { name: 'Accept new date' }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('wires cancel button to onCancel', () => {
    const onCancel = vi.fn()
    render(<ScheduleDelayAlert {...baseProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons and swaps label while accepting=true', () => {
    render(<ScheduleDelayAlert {...baseProps} accepting={true} />)

    // accept button now shows the in-flight label and is disabled
    expect(screen.getByText('Working…')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons.every((b) => b.disabled)).toBe(true)
  })

  it('disables both buttons and swaps label while cancelling=true', () => {
    render(<ScheduleDelayAlert {...baseProps} cancelling={true} />)
    expect(screen.getByText('Cancelling…')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons.every((b) => b.disabled)).toBe(true)
  })

  it('clicking accept while busy must NOT trigger onAccept (guards against double-submit)', () => {
    const onAccept = vi.fn()
    render(<ScheduleDelayAlert {...baseProps} accepting={true} onAccept={onAccept} />)
    // Button is disabled → click is a no-op in the DOM contract
    const acceptBtn = screen.getByText('Working…').closest('button')
    fireEvent.click(acceptBtn)
    expect(onAccept).not.toHaveBeenCalled()
  })
})
