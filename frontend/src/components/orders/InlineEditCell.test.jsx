import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../i18n/useI18n', () => ({
  default: () => ({ t: { orderList: { editHint: 'Double-click to edit' } } }),
}))

import InlineEditCell from './InlineEditCell'

/**
 * Inline edit 是訂單清單最常用的快捷操作之一：
 *  - 預設 read-mode、雙擊進編輯模式
 *  - Enter / blur 觸發 onCommit（且只有真的改變才 commit）
 *  - Escape 取消，不送 commit
 *  - disabled 時根本不可編輯（防 cancelled 訂單被改）
 */
describe('InlineEditCell', () => {
  it('renders the display value in read mode', () => {
    render(
      <InlineEditCell value={123} display="123 wafers" onCommit={vi.fn()} />,
    )
    expect(screen.getByText('123 wafers')).toBeInTheDocument()
  })

  it('falls back to value when display is omitted', () => {
    render(<InlineEditCell value={456} onCommit={vi.fn()} />)
    expect(screen.getByText('456')).toBeInTheDocument()
  })

  it('shows "—" when both value and display are nullish', () => {
    render(<InlineEditCell value={null} onCommit={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('disabled cell renders text and never enters edit mode', () => {
    const onCommit = vi.fn()
    render(
      <InlineEditCell
        value={123}
        display="locked"
        disabled
        onCommit={onCommit}
      />,
    )
    fireEvent.doubleClick(screen.getByText('locked'))
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('enters edit mode on double-click and commits new value on Enter', () => {
    const onCommit = vi.fn()
    render(<InlineEditCell value="old" onCommit={onCommit} />)
    fireEvent.doubleClick(screen.getByText('old'))

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'new' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onCommit).toHaveBeenCalledWith('new')
  })

  it('commits on blur (clicking away)', () => {
    const onCommit = vi.fn()
    render(<InlineEditCell value="old" onCommit={onCommit} />)
    fireEvent.doubleClick(screen.getByText('old'))

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'changed' } })
    fireEvent.blur(input)

    expect(onCommit).toHaveBeenCalledWith('changed')
  })

  it('Escape cancels and does NOT commit', () => {
    const onCommit = vi.fn()
    render(<InlineEditCell value="old" onCommit={onCommit} />)
    fireEvent.doubleClick(screen.getByText('old'))

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'should-be-discarded' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(onCommit).not.toHaveBeenCalled()
    // back in read mode
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('old')).toBeInTheDocument()
  })

  it('does NOT commit when value is unchanged (prevents accidental writes on blur)', () => {
    const onCommit = vi.fn()
    render(<InlineEditCell value="same" onCommit={onCommit} />)
    fireEvent.doubleClick(screen.getByText('same'))
    fireEvent.blur(screen.getByRole('textbox'))
    expect(onCommit).not.toHaveBeenCalled()
  })
})
