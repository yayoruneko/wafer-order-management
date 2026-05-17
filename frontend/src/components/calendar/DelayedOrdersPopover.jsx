import { memo } from 'react'
import { AlertTriangle, CalendarDays, Info, X, ArrowRight } from 'lucide-react'
import Modal from '../createOrder/Modal'
import useI18n from '../../i18n/useI18n'
import { calendarStyles as s } from '../../styles/calendarStyles'

function useFormatDate() {
  const { t } = useI18n()
  return (iso) => {
    if (!iso) return '—'
    const d = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString(t.locale, t.calendar.dateFormat)
  }
}

function customerInitials(name) {
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}

function OrderRow({ order }) {
  const { t } = useI18n()
  const p = t.calendar.popover
  const formatDate = useFormatDate()
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
            {p.delayPill(order.delayDays)}
          </span>
        ) : (
          <span className={s.orderOnTrackPill}>{p.onTrack}</span>
        )}
      </div>

      <div className={s.orderDateGrid}>
        <div>
          <div className={s.orderDateLabel}>{p.customerDue}</div>
          <div className={s.orderDateValue}>{formatDate(order.requestedDate)}</div>
        </div>
        <div>
          <div className={s.orderDateLabel}>
            <ArrowRight className="inline h-3 w-3" /> {p.expectedDone}
          </div>
          <div className={delayed ? s.orderDateValueDanger : s.orderDateValue}>
            {formatDate(order.rescheduledDate)}
          </div>
        </div>
      </div>

      <div className={s.orderQty}>
        {p.dailyOutput(order.qty.toLocaleString(t.locale))}
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
  const { t } = useI18n()
  const p = t.calendar.popover
  const formatDate = useFormatDate()
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
            <div className={s.popoverTitle}>{p.title(formatDate(day.iso))}</div>
            <div className={s.popoverSubtitle}>
              {p.subtitle(
                day.count.toLocaleString(t.locale),
                day.capacity.toLocaleString(t.locale),
                orders.length,
              )}
              {hasDelay ? p.delayedSuffix(delayedCount) : ''}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={s.popoverCloseBtn}
          onClick={onClose}
          aria-label={p.closeAria}
        >
          <X className={s.popoverCloseIcon} />
        </button>
      </div>

      <div className={s.popoverBody}>
        {orders.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-stone-400">
            {p.empty}
          </div>
        ) : (
          orders.map((order) => (
            <OrderRow key={order.orderId ?? order.id} order={order} />
          ))
        )}
      </div>

      <div className={s.popoverFooter}>
        <button type="button" className={s.popoverGhostBtn} onClick={onClose}>
          {p.close}
        </button>
      </div>
    </Modal>
  )
}

export default memo(DelayedOrdersPopoverBase)
