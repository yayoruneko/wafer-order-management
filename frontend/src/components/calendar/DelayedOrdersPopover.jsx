import { memo } from 'react'
import { AlertTriangle, CalendarDays, Info, X, ArrowRight } from 'lucide-react'
import Modal from '../createOrder/Modal'
import { calendarStyles as s } from '../../styles/calendarStyles'

const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${SHORT_MONTH[Number(m) - 1]} ${Number(d)}, ${y}`
}

function customerInitials(name) {
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}

function OrderRow({ order }) {
  const delayed = !!order.isDelayed
  return (
    <div className={s.orderCard}>
      <div className={s.orderCardRow}>
        <div className={s.orderCardCustomer}>
          <span
            className={s.orderCardLogo}
            style={{ backgroundColor: order.customerColor || '#78716c' }}
          >
            {customerInitials(order.customerName)}
          </span>
          <div className="min-w-0">
            <div className={s.orderCardId}>{order.orderId ?? order.id}</div>
            <div className={s.orderCardName}>{order.customerName}</div>
          </div>
        </div>
        {delayed ? (
          <span className={s.orderDelayPill}>
            <AlertTriangle className={s.orderDelayPillIcon} />
            延後 {order.delayDays} 天
          </span>
        ) : (
          <span className={s.orderOnTrackPill}>準時</span>
        )}
      </div>

      <div className={s.orderDateGrid}>
        <div>
          <div className={s.orderDateLabel}>客戶交期</div>
          <div className={s.orderDateValue}>{formatDate(order.requestedDate)}</div>
        </div>
        <div>
          <div className={s.orderDateLabel}>
            <ArrowRight className="inline h-3 w-3" /> 預計完成
          </div>
          <div className={delayed ? s.orderDateValueDanger : s.orderDateValue}>
            {formatDate(order.rescheduledDate)}
          </div>
        </div>
      </div>

      <div className={s.orderQty}>
        當日生產：{order.qty.toLocaleString('en-US')} wafers
      </div>

      {delayed && order.scheduleWarning ? (
        <div className={s.orderReason}>
          <Info className={s.orderReasonIcon} />
          <span>{order.scheduleWarning}</span>
        </div>
      ) : null}
    </div>
  )
}

function DelayedOrdersPopoverBase({ open, day, onClose }) {
  if (!open || !day) return null

  const orders = day.orders ?? []
  const delayedCount = orders.filter((o) => o.isDelayed).length
  const hasDelay = delayedCount > 0

  return (
    <Modal open={open} onClose={onClose} width="max-w-[520px]">
      <div className={s.popoverHeader}>
        <div className={s.popoverTitleWrap}>
          <span
            className={hasDelay ? s.popoverIconWrap : s.popoverIconWrapNeutral}
          >
            {hasDelay ? (
              <AlertTriangle className={s.popoverIcon} />
            ) : (
              <CalendarDays className={s.popoverIcon} />
            )}
          </span>
          <div>
            <div className={s.popoverTitle}>當日排程 — {formatDate(day.iso)}</div>
            <div className={s.popoverSubtitle}>
              產能 {day.count.toLocaleString('en-US')} / {day.capacity.toLocaleString('en-US')}
              ，共 {orders.length} 筆訂單
              {hasDelay ? `（${delayedCount} 筆延誤）` : ''}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={s.popoverCloseBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <X className={s.popoverCloseIcon} />
        </button>
      </div>

      <div className={s.popoverBody}>
        {orders.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-stone-400">
            此日無排程訂單
          </div>
        ) : (
          orders.map((order) => (
            <OrderRow key={order.orderId ?? order.id} order={order} />
          ))
        )}
      </div>

      <div className={s.popoverFooter}>
        <button type="button" className={s.popoverGhostBtn} onClick={onClose}>
          關閉
        </button>
      </div>
    </Modal>
  )
}

export default memo(DelayedOrdersPopoverBase)
