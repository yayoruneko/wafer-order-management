import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../i18n/useI18n', () => ({
  default: () => ({
    t: {
      common: { search: 'Search' },
      filters: {
        orderIdPlaceholder: 'Order ID',
        customerPlaceholder: 'Customer',
        resetFilters: 'Reset',
      },
      statuses: {
        ALL: 'All',
        SCHEDULED: 'Scheduled',
        CANCELLED: 'Cancelled',
        PENDING: 'Pending',
        IN_PRODUCTION: 'In production',
        COMPLETED: 'Completed',
      },
    },
  }),
}))

// DateRangePicker is irrelevant to these tests; render a no-op stub.
vi.mock('./DateRangePicker', () => ({
  default: () => <div data-testid="date-range" />,
}))

import OrderFilters from './OrderFilters'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

/**
 * 規則：
 *  - 任意輸入框 keystroke 後 500ms 才觸發 onSearch（debounce）
 *  - Enter 立刻 flush（不等 debounce）
 *  - 點 Search 立刻 flush
 *  - Reset 清空所有欄位並呼叫 onReset
 *  - 送出的 payload 形狀固定（id/customer/status/dateRange）
 */
describe('OrderFilters', () => {
  it('debounces input changes by 500ms before calling onSearch', () => {
    const onSearch = vi.fn()
    render(<OrderFilters onSearch={onSearch} />)
    // The hook fires an initial effect with empty values; drop that.
    act(() => vi.advanceTimersByTime(500))
    onSearch.mockClear()

    fireEvent.change(screen.getByPlaceholderText('Order ID'), {
      target: { value: 'WO-42' },
    })

    // Not yet
    act(() => vi.advanceTimersByTime(499))
    expect(onSearch).not.toHaveBeenCalled()

    // Now
    act(() => vi.advanceTimersByTime(1))
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch.mock.calls[0][0].id).toBe('WO-42')
  })

  it('Enter in any input flushes immediately, skipping the debounce', () => {
    const onSearch = vi.fn()
    render(<OrderFilters onSearch={onSearch} />)
    act(() => vi.advanceTimersByTime(500))
    onSearch.mockClear()

    const customer = screen.getByPlaceholderText('Customer')
    fireEvent.change(customer, { target: { value: 'Acme' } })
    fireEvent.keyDown(customer, { key: 'Enter' })

    expect(onSearch).toHaveBeenCalled()
    expect(onSearch.mock.calls[0][0].customer).toBe('Acme')
  })

  it('clicking Search button fires onSearch immediately', () => {
    const onSearch = vi.fn()
    render(<OrderFilters onSearch={onSearch} />)
    act(() => vi.advanceTimersByTime(500))
    onSearch.mockClear()

    fireEvent.change(screen.getByPlaceholderText('Order ID'), {
      target: { value: 'foo' },
    })
    fireEvent.click(screen.getByText('Search'))
    expect(onSearch).toHaveBeenCalled()
  })

  it('Reset clears all fields and calls onReset', () => {
    const onReset = vi.fn()
    render(<OrderFilters onSearch={vi.fn()} onReset={onReset} />)

    const idInput = screen.getByPlaceholderText('Order ID')
    fireEvent.change(idInput, { target: { value: 'dirty' } })
    expect(idInput.value).toBe('dirty')

    fireEvent.click(screen.getByText('Reset'))
    expect(idInput.value).toBe('')
    expect(onReset).toHaveBeenCalled()
  })

  it('payload always has the shape {id, customer, status, dateRange:{fromIso,toIso}}', () => {
    const onSearch = vi.fn()
    render(<OrderFilters onSearch={onSearch} />)
    act(() => vi.advanceTimersByTime(500))

    expect(onSearch).toHaveBeenCalled()
    const payload = onSearch.mock.calls[0][0]
    expect(payload).toEqual({
      id: '',
      customer: '',
      status: 'ALL',
      dateRange: { fromIso: '', toIso: '' },
    })
  })

  it('trims whitespace around id and customer before firing search', () => {
    const onSearch = vi.fn()
    render(<OrderFilters onSearch={onSearch} />)
    act(() => vi.advanceTimersByTime(500))
    onSearch.mockClear()

    fireEvent.change(screen.getByPlaceholderText('Order ID'), {
      target: { value: '  spaced  ' },
    })
    act(() => vi.advanceTimersByTime(500))
    expect(onSearch.mock.calls.at(-1)[0].id).toBe('spaced')
  })
})
