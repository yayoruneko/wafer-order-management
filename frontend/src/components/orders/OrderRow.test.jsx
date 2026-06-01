import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../i18n/useI18n', () => ({
  default: () => ({
    t: {
      locale: 'en-US',
      orderList: {
        expandHint: 'Click to expand',
        editOrderAria: (id) => `Edit ${id}`,
        cancelOrderAria: (id) => `Cancel ${id}`,
        editHint: 'Double-click',
        selectOrder: (id) => `Select ${id}`,
      },
      orderSlots: {
        toggleShow: 'Show slots',
        toggleHide: 'Hide slots',
      },
      statuses: {
        SCHEDULED: 'Scheduled',
        CANCELLED: 'Cancelled',
        PENDING: 'Pending',
        IN_PRODUCTION: 'In production',
        COMPLETED: 'Completed',
      },
      schedule: {
        onTrack: 'On track',
        delayedDays: (n) => `${n}d late`,
        showConflict: 'Show conflict',
        hideConflict: 'Hide conflict',
      },
    },
  }),
}))

import OrderRow from './OrderRow'

const baseOrder = (over = {}) => ({
  id: 'WO-20260601-ABC12345',
  customerCode: 'C001',
  customerName: 'Acme',
  customerColor: '#76B900',
  qty: 1200,
  status: 'SCHEDULED',
  dueDate: '2026-07-01',
  expected: '2026-07-01',
  delayedDays: 0,
  createdBy: 'alice',
  ...over,
})

/**
 * OrderRow 是訂單列表每一列的核心 UI，承擔很多條件分支：
 *  - 取消的訂單：劃線、不可選、不顯示展開、不顯示取消按鈕
 *  - 延誤的訂單：紅色 schedule cell、可展開看 slot 拆分
 *  - 編輯/取消按鈕只有 canModify 時才出現
 *  - 雙擊 qty / dueDate 走 InlineEditCell 路徑，commit 會帶上 order.id
 *
 * 此處只測 row 自身的行為，不下到 InlineEditCell 內部（那有它自己的測試）。
 */
describe('OrderRow', () => {
  it('shows the order id, customer, qty, and createdBy', () => {
    render(<OrderRow order={baseOrder()} />)
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('C001')).toBeInTheDocument()
    expect(screen.getByText('1,200')).toBeInTheDocument()
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('renders edit and cancel buttons when canModify=true (default)', () => {
    const onEdit = vi.fn()
    const onCancel = vi.fn()
    render(
      <OrderRow order={baseOrder()} onEdit={onEdit} onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByLabelText(/Edit WO-/))
    fireEvent.click(screen.getByLabelText(/Cancel WO-/))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('hides edit/cancel buttons when canModify=false', () => {
    render(<OrderRow order={baseOrder()} canModify={false} />)
    expect(screen.queryByLabelText(/Edit WO-/)).toBeNull()
    expect(screen.queryByLabelText(/Cancel WO-/)).toBeNull()
  })

  it('hides edit and cancel buttons for terminal orders (cancelled / completed)', () => {
    // CANCELLED / COMPLETED 都不該允許再被修改或取消（後端會擋），UI 也對應隱藏
    const { rerender } = render(<OrderRow order={baseOrder({ status: 'CANCELLED' })} />)
    expect(screen.queryByLabelText(/Edit WO-/)).toBeNull()
    expect(screen.queryByLabelText(/Cancel WO-/)).toBeNull()

    rerender(<OrderRow order={baseOrder({ status: 'COMPLETED' })} />)
    expect(screen.queryByLabelText(/Edit WO-/)).toBeNull()
    expect(screen.queryByLabelText(/Cancel WO-/)).toBeNull()
  })

  it('clicking the row toggles expand only when expandable', () => {
    const onToggleExpand = vi.fn()
    const { container } = render(
      <OrderRow
        order={baseOrder({ status: 'SCHEDULED', delayedDays: 3 })}
        onToggleExpand={onToggleExpand}
      />,
    )
    // The row is the outermost div
    const row = container.firstChild
    fireEvent.click(row)
    expect(onToggleExpand).toHaveBeenCalledWith('WO-20260601-ABC12345')
  })

  it('clicking inside an action button does NOT toggle expand', () => {
    const onToggleExpand = vi.fn()
    const onEdit = vi.fn()
    render(
      <OrderRow
        order={baseOrder({ delayedDays: 3 })}
        onToggleExpand={onToggleExpand}
        onEdit={onEdit}
      />,
    )
    fireEvent.click(screen.getByLabelText(/Edit WO-/))
    expect(onEdit).toHaveBeenCalled()
    expect(onToggleExpand).not.toHaveBeenCalled()
  })

  it('cancelled order has no expand affordance even with onToggleExpand passed', () => {
    const onToggleExpand = vi.fn()
    const { container } = render(
      <OrderRow
        order={baseOrder({ status: 'CANCELLED' })}
        onToggleExpand={onToggleExpand}
      />,
    )
    fireEvent.click(container.firstChild)
    expect(onToggleExpand).not.toHaveBeenCalled()
  })

  it('checkbox calls onToggleSelect with the order id', () => {
    const onToggleSelect = vi.fn()
    render(
      <OrderRow order={baseOrder()} onToggleSelect={onToggleSelect} />,
    )
    fireEvent.click(screen.getByLabelText('Select WO-20260601-ABC12345'))
    expect(onToggleSelect).toHaveBeenCalledWith('WO-20260601-ABC12345')
  })

  it('checkbox is disabled when canModify=false', () => {
    render(<OrderRow order={baseOrder()} canModify={false} />)
    expect(screen.getByLabelText('Select WO-20260601-ABC12345')).toBeDisabled()
  })

  it('shows expand toggle (chevron) when expandable and reflects aria-expanded', () => {
    const onToggleExpand = vi.fn()
    render(
      <OrderRow
        order={baseOrder({ delayedDays: 3 })}
        onToggleExpand={onToggleExpand}
        expanded={true}
      />,
    )
    const toggle = screen.getByRole('button', { name: /Hide slots/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})
