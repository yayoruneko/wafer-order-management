import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CancelOrderDialog from './CancelOrderDialog'

vi.mock('../../i18n/useI18n', () => ({
  default: () => ({
    t: {
      cancelDialog: {
        titleSingle: 'This order is in production!',
        titleBulk: 'Selection includes orders in production!',
        subtitleSingle: 'In-prod subtitle',
        subtitleBulk: (n) => `${n} in prod`,
        body: 'Cancelling will release used capacity, affect other scheduled orders, and cannot be undone.',
        affectedHeading: 'Affected in-production orders',
        affectedHeadingGeneral: 'Orders to be cancelled',
        moreCount: (n) => `…and ${n} more`,
        bulkBreakdown: (inProd, total) => `${inProd} of ${total} are in production`,
        irreversibleNote: 'This action cannot be undone.',
        titleSingleConfirm: 'Confirm cancellation?',
        subtitleSingleConfirm: 'Continue?',
        titleBulkConfirm: (n) => `Cancel ${n} orders?`,
        subtitleBulkConfirm: (n) => `${n} selected`,
        cancelBtn: 'Back',
        confirmBtn: 'Confirm cancel order',
        confirmBtnBulk: (n) => `Confirm cancel ${n} orders`,
        closeAria: 'Close',
        waferUnit: 'wafers',
      },
    },
  }),
}))

const baseOrder = (overrides = {}) => ({
  id: 'WO-1',
  customerName: 'Acme',
  qty: 1200,
  ...overrides,
})

/**
 * §3.2 contract: cancelling an IN_PRODUCTION order must surface an extra
 * confirmation warning before doing it. This component is the warning UI.
 *
 *   - Single mode + hasInProdWarning=true → red-flagged title + body text
 *   - Single mode + hasInProdWarning=false → plain "are you sure" confirm
 *   - Bulk mode → shows count breakdown
 *   - Confirm / cancel / close all wired correctly
 *   - Affected-order list truncates after MAX_LIST=5 with "…and N more"
 */
describe('CancelOrderDialog', () => {
  it('renders the IN_PRODUCTION warning copy in single mode', () => {
    render(
      <CancelOrderDialog
        open={true}
        mode="single"
        order={baseOrder()}
        hasInProdWarning={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText('This order is in production!')).toBeInTheDocument()
    // body explaining capacity release / irreversibility appears
    expect(screen.getByText(/release used capacity/)).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('renders the plain confirmation copy when not in production', () => {
    render(
      <CancelOrderDialog
        open={true}
        mode="single"
        order={baseOrder()}
        hasInProdWarning={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText('Confirm cancellation?')).toBeInTheDocument()
    // body only shows for the IN_PROD variant; not for plain confirm
    expect(screen.queryByText(/release used capacity/)).toBeNull()
  })

  it('shows affected-orders list with customer + qty', () => {
    render(
      <CancelOrderDialog
        open={true}
        mode="single"
        order={baseOrder({ id: 'WO-42', customerName: 'Globex', qty: 1200 })}
        hasInProdWarning={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText('WO-42')).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()
    // formatQty inserts thousands separators
    expect(screen.getByText(/1,200/)).toBeInTheDocument()
  })

  it('bulk mode shows breakdown (in-prod count vs total selected)', () => {
    const inProdOrders = [
      baseOrder({ id: 'WO-1' }),
      baseOrder({ id: 'WO-2' }),
    ]
    render(
      <CancelOrderDialog
        open={true}
        mode="bulk"
        inProductionOrders={inProdOrders}
        totalSelected={5}
        hasInProdWarning={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText('Selection includes orders in production!')).toBeInTheDocument()
    expect(screen.getByText('2 of 5 are in production')).toBeInTheDocument()
    expect(screen.getByText('Confirm cancel 5 orders')).toBeInTheDocument()
  })

  it('truncates the affected list after 5 entries with "…and N more"', () => {
    const seven = Array.from({ length: 7 }, (_, i) =>
      baseOrder({ id: `WO-${i + 1}`, customerName: `Cust ${i + 1}` }),
    )
    render(
      <CancelOrderDialog
        open={true}
        mode="bulk"
        inProductionOrders={seven}
        totalSelected={7}
        hasInProdWarning={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    // First 5 IDs visible
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`WO-${i}`)).toBeInTheDocument()
    }
    // 6 and 7 collapsed
    expect(screen.queryByText('WO-6')).toBeNull()
    expect(screen.getByText('…and 2 more')).toBeInTheDocument()
  })

  it('confirm button is wired to onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <CancelOrderDialog
        open={true}
        mode="single"
        order={baseOrder()}
        hasInProdWarning={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    )
    fireEvent.click(screen.getByText('Confirm cancel order'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('back and close buttons are both wired to onClose', () => {
    const onClose = vi.fn()
    render(
      <CancelOrderDialog
        open={true}
        mode="single"
        order={baseOrder()}
        hasInProdWarning={true}
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Back'))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('renders nothing when open=false', () => {
    render(
      <CancelOrderDialog
        open={false}
        mode="single"
        order={baseOrder()}
        hasInProdWarning={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.queryByText(/in production/i)).toBeNull()
  })
})
