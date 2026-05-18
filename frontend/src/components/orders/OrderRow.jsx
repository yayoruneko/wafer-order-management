import { memo } from 'react'
import { ChevronRight, Pencil, X } from 'lucide-react'
import { Cell } from './Cell'
import StatusPill from './StatusPill'
import CustomerLogo from './CustomerLogo'
import ScheduleCell from './ScheduleCell'
import InlineEditCell from './InlineEditCell'
import Checkbox from './Checkbox'
import useI18n from '../../i18n/useI18n'
import {
  colWidths,
  formatDate,
  formatQty,
  styles,
} from '../../styles/orderListStyles'

function OrderRowBase({
  order,
  selected,
  onToggleSelect,
  onEdit,
  onCancel,
  onUpdateField,
  expanded = false,
  onToggleExpand,
}) {
  const { t } = useI18n()
  const cancelled = order.status === 'CANCELLED'
  const delayed = order.delayedDays > 0 && !cancelled
  const expandable = !cancelled && !!onToggleExpand
  const strike = cancelled ? styles.cellStrike : ''
  const baseTextStrong = cancelled
    ? `${styles.cellTextStrong} ${styles.cellStrike}`
    : styles.cellTextStrong
  const baseText = cancelled
    ? `${styles.cellText} ${styles.cellStrike}`
    : styles.cellText
  const expectedClass = cancelled
    ? `${styles.cellText} ${styles.cellStrike}`
    : delayed
      ? styles.cellRed
      : styles.cellText

  const rowClass = `${delayed ? styles.rowDelayed : styles.row} h-14 ${
    expandable ? 'cursor-pointer' : ''
  } ${selected ? styles.rowSelected : ''}`

  const handleRowClick = (e) => {
    if (!expandable) return
    if (e.target.closest('button, input, label, a, [data-no-expand]')) return
    onToggleExpand?.(order.id)
  }

  return (
    <div
      className={rowClass}
      onClick={handleRowClick}
      title={expandable ? t.orderList.expandHint : undefined}
    >
      {delayed && <div className={styles.rowAccentDelayed} />}

      <Cell className={`${colWidths.select} justify-center`} data-no-expand>
        <Checkbox
          checked={!!selected}
          onChange={() => onToggleSelect?.(order.id)}
          ariaLabel={t.orderList.selectOrder(order.id)}
        />
      </Cell>

      <Cell className={colWidths.id}>
        <div className={styles.idCellRow}>
          {expandable ? (
            <button
              type="button"
              className={styles.idExpandBtn}
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand?.(order.id)
              }}
              aria-expanded={expanded}
              aria-controls={`slots-${order.id}`}
              aria-label={
                expanded ? t.orderSlots.toggleHide : t.orderSlots.toggleShow
              }
              title={expanded ? t.orderSlots.toggleHide : t.orderSlots.toggleShow}
            >
              <ChevronRight
                className={
                  expanded ? styles.idExpandIconOpen : styles.idExpandIcon
                }
              />
            </button>
          ) : null}
          <span className={baseTextStrong}>
            {(() => {
              const parts = order.id.split('-')
              if (parts.length >= 3) {
                const prefix = parts.slice(0, 2).join('-') + '-'
                const suffix = parts.slice(2).join('-')
                return <><span className="whitespace-nowrap">{prefix}</span><br />{suffix}</>
              }
              return order.id
            })()}
          </span>
        </div>
      </Cell>

      <Cell className={colWidths.customer}>
        <div className={styles.customerBlock}>
          <CustomerLogo
            name={order.customerName}
            color={order.customerColor}
            dimmed={cancelled}
          />
          <div className={styles.customerNameWrap}>
            <span className={`${styles.customerName} ${strike}`}>
              {order.customerName}
            </span>
            <span className={`${styles.customerCode} ${strike}`}>
              {order.customerCode}
            </span>
          </div>
        </div>
      </Cell>

      <Cell className={colWidths.qty} data-no-expand>
        <InlineEditCell
          value={order.qty}
          display={formatQty(order.qty)}
          type="number"
          disabled={cancelled}
          textClassName={baseText}
          onCommit={(v) => {
            const num = Number(String(v).replace(/,/g, ''))
            if (!Number.isNaN(num) && num > 0) {
              onUpdateField?.(order.id, { qty: num })
            }
          }}
        />
      </Cell>

      <Cell className={colWidths.status}>
        <StatusPill status={order.status} />
      </Cell>

      <Cell className={colWidths.due} data-no-expand>
        <InlineEditCell
          value={order.dueDate ?? ''}
          display={formatDate(order.dueDate, t.locale)}
          type="date"
          disabled={cancelled}
          textClassName={baseText}
          onCommit={(v) => onUpdateField?.(order.id, { dueDate: v })}
        />
      </Cell>

      <Cell className={colWidths.exp}>
        <span className={expectedClass}>
          {cancelled
            ? formatDate(order.dueDate, t.locale)
            : formatDate(order.expected, t.locale)}
        </span>
      </Cell>

      <Cell className={colWidths.schedule}>
        {cancelled ? (
          <span className={styles.cellMuted}>—</span>
        ) : (
          <ScheduleCell
            status={order.status}
            delayedDays={order.delayedDays}
            expandable={delayed && !!onToggleExpand}
            expanded={expanded}
            onToggle={() => onToggleExpand?.(order.id)}
            orderId={order.id}
          />
        )}
      </Cell>

      <Cell className={`${colWidths.actions} gap-1`} data-no-expand>
        <button
          className={styles.iconBtn}
          onClick={() => onEdit?.(order)}
          aria-label={t.orderList.editOrderAria(order.id)}
          title={t.orderList.editOrderAria(order.id)}
        >
          <Pencil className={styles.pencilIcon} />
        </button>
        {!cancelled && (
          <button
            className={styles.iconBtnDanger}
            onClick={() => onCancel?.(order)}
            aria-label={t.orderList.cancelOrderAria(order.id)}
            title={t.orderList.cancelOrderAria(order.id)}
          >
            <X className={styles.closeIcon} />
          </button>
        )}
      </Cell>
    </div>
  )
}

export default memo(OrderRowBase)
