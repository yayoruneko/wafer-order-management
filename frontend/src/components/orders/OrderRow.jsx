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
    selected ? styles.rowSelected : ''
  }`

  return (
    <div className={rowClass}>
      {delayed && <div className={styles.rowAccentDelayed} />}

      <Cell className={`${colWidths.select} justify-center`}>
        <Checkbox
          checked={!!selected}
          onChange={() => onToggleSelect?.(order.id)}
          ariaLabel={`Select ${order.id}`}
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
          <span className={baseTextStrong}>{order.id}</span>
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

      <Cell className={colWidths.qty}>
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

      <Cell className={colWidths.due}>
        <InlineEditCell
          value={order.dueDate ?? ''}
          display={formatDate(order.dueDate)}
          type="date"
          disabled={cancelled}
          textClassName={baseText}
          onCommit={(v) => onUpdateField?.(order.id, { dueDate: v })}
        />
      </Cell>

      <Cell className={colWidths.exp}>
        <span className={expectedClass}>
          {cancelled ? formatDate(order.dueDate) : formatDate(order.expected)}
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

      <Cell className={`${colWidths.actions} gap-1`}>
        <button
          className={styles.iconBtn}
          onClick={() => onEdit?.(order)}
          aria-label={`Edit order ${order.id}`}
          title={`Edit order ${order.id}`}
        >
          <Pencil className={styles.pencilIcon} />
        </button>
        {!cancelled && (
          <button
            className={styles.iconBtnDanger}
            onClick={() => onCancel?.(order)}
            aria-label={`Cancel order ${order.id}`}
            title={`Cancel order ${order.id}`}
          >
            <X className={styles.closeIcon} />
          </button>
        )}
      </Cell>
    </div>
  )
}

export default memo(OrderRowBase)
