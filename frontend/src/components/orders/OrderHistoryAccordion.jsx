import { memo, useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { getOrderHistory } from '../../api/orderApi'
import { formatDate, styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function changeTypeClass(type) {
  if (type === 'CREATED') return 'text-emerald-700'
  if (type === 'CANCELLED') return 'text-red-600'
  return 'text-stone-700'
}

function OrderHistoryAccordionBase({ order }) {
  const { t } = useI18n()
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getOrderHistory(order.id)
      .then(({ data }) => {
        if (cancelled) return
        setHistory(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancelled) return
        setError(t.orderHistory.loadError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [order.id, t])

  return (
    <div className={`${styles.slotsWrap} bg-stone-50/40`}>
      <div className={`${styles.slotsInner} max-w-[760px]`}>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-stone-500" />
          <span className={styles.slotsTitle}>{t.orderHistory.title}</span>
        </div>

        {loading ? (
          <div className={styles.slotsLoading}>{t.orderHistory.loading}</div>
        ) : error ? (
          <div className={styles.slotsError}>{error}</div>
        ) : !history || history.length === 0 ? (
          <div className={styles.slotsEmpty}>{t.orderHistory.empty}</div>
        ) : (
          <div>
            <div className="grid grid-cols-[100px_120px_160px_80px_100px_80px] gap-2 border-b border-stone-200 pb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              <span>{t.orderHistory.columns.action}</span>
              <span>{t.orderHistory.columns.by}</span>
              <span>{t.orderHistory.columns.time}</span>
              <span className="text-right">{t.orderHistory.columns.qty}</span>
              <span className="text-right">{t.orderHistory.columns.dueDate}</span>
              <span>{t.orderHistory.columns.status}</span>
            </div>
            {history.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[100px_120px_160px_80px_100px_80px] items-center gap-2 border-b border-stone-100 py-1.5 last:border-b-0 text-[12px] text-stone-800"
              >
                <span className={`font-medium ${changeTypeClass(h.changeType)}`}>
                  {t.orderHistory.changeType[h.changeType] ?? h.changeType}
                </span>
                <span className="truncate font-mono text-[11px] text-stone-600">
                  {h.changedByUsername ?? h.changedBy}
                </span>
                <span className="text-[11px] text-stone-500">
                  {h.changedAt
                    ? new Date(h.changedAt).toLocaleString(t.locale, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
                <span className="text-right font-mono">
                  {h.snapshotQuantity != null
                    ? h.snapshotQuantity.toLocaleString()
                    : '—'}
                </span>
                <span className="text-right">
                  {h.snapshotCustomerDueDate
                    ? formatDate(h.snapshotCustomerDueDate, t.locale)
                    : '—'}
                </span>
                <span className="text-[11px] text-stone-500">
                  {h.snapshotStatus ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(OrderHistoryAccordionBase)
