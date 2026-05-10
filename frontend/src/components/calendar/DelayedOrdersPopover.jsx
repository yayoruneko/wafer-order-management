import { memo } from 'react'
import { AlertTriangle, Info, X, ArrowRight } from 'lucide-react'
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
            <div className={s.orderCardId}>{order.id}</div>
            <div className={s.orderCardName}>{order.customerName}</div>
          </div>
        </div>
        <span className={s.orderDelayPill}>
          <AlertTriangle className={s.orderDelayPillIcon} />
          延後 {order.delayDays} 天
        </span>
      </div>

      <div className={s.orderDateGrid}>
        <div>
          <div className={s.orderDateLabel}>原訂日期</div>
          <div className={s.orderDateValue}>{formatDate(order.requestedDate)}</div>
        </div>
        <div>
          <div className={s.orderDateLabel}>
            <ArrowRight className="inline h-3 w-3" /> 重排日期
          </div>
          <div className={s.orderDateValueDanger}>
            {formatDate(order.rescheduledDate)}
          </div>
        </div>
      </div>

      <div className={s.orderQty}>
        數量：{order.qty.toLocaleString('en-US')} wafers
      </div>

      {order.scheduleWarning ? (
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

  return (
    <Modal open={open} onClose={onClose} width="max-w-[520px]">
      <div className={s.popoverHeader}>
        <div className={s.popoverTitleWrap}>
          <span className={s.popoverIconWrap}>
            <AlertTriangle className={s.popoverIcon} />
          </span>
          <div>
            <div className={s.popoverTitle}>排程衝突 — {formatDate(day.iso)}</div>
            <div className={s.popoverSubtitle}>
              當日產能 {day.count.toLocaleString('en-US')} / {day.capacity.toLocaleString('en-US')}，共 {day.delayedOrders.length} 筆訂單延誤
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
        {day.delayedOrders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
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
