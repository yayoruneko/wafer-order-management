import { memo, useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { getOrderSlots } from '../../api/orderApi'
import { formatDate, formatQty, styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function shareColor(pct) {
  if (pct >= 50)
    return { bar: 'bg-rose-500', track: 'bg-rose-100', text: 'text-rose-600' }
  if (pct >= 25)
    return { bar: 'bg-amber-400', track: 'bg-amber-100', text: 'text-amber-600' }
  return {
    bar: 'bg-emerald-500',
    track: 'bg-emerald-100',
    text: 'text-emerald-600',
  }
}

function OrderSlotsAccordionBase({ order }) {
  const { t } = useI18n()
  const [slots, setSlots] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getOrderSlots(order.id)
      .then(({ data }) => {
        if (cancelled) return
        setSlots(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancelled) return
        setError(t.orderSlots.loadError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [order.id, t])

  const totalQty = (slots ?? []).reduce((sum, s) => sum + (s.quantity ?? 0), 0)
  const maxQty = (slots ?? []).reduce(
    (m, s) => Math.max(m, s.quantity ?? 0),
    0,
  )

  return (
    <div
      className={styles.slotsWrap}
      role="region"
      aria-label={t.orderSlots.regionAria(order.id)}
    >
      <div className={`${styles.slotsInner} max-w-[640px]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-stone-500" />
            <span className={styles.slotsTitle}>{t.orderSlots.title}</span>
          </div>
          {slots && slots.length > 0 ? (
            <span className={styles.slotsSummary}>
              {t.orderSlots.summary(slots.length, formatQty(totalQty))}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className={styles.slotsLoading}>{t.orderSlots.loading}</div>
        ) : error ? (
          <div className={styles.slotsError}>{error}</div>
        ) : !slots || slots.length === 0 ? (
          <div className={styles.slotsEmpty}>{t.orderSlots.empty}</div>
        ) : (
          <div>
            <div className={styles.slotsTableHead}>
              <span>{t.orderSlots.columns.date}</span>
              <span>{t.orderSlots.columns.qty}</span>
              <span>{t.orderSlots.columns.share}</span>
            </div>
            {slots.map((slot) => {
              const ratio =
                maxQty > 0 ? Math.max(8, Math.round((slot.quantity / maxQty) * 100)) : 0
              const pct =
                totalQty > 0
                  ? Math.round((slot.quantity / totalQty) * 100)
                  : 0
              const c = shareColor(pct)
              return (
                <div key={slot.id ?? `${slot.slotDate}-${slot.quantity}`} className={styles.slotsRow}>
                  <span className={styles.slotsRowDate}>
                    {formatDate(slot.slotDate, t.locale)}
                  </span>
                  <span className={styles.slotsRowQty}>
                    {formatQty(slot.quantity)}
                  </span>
                  <span className={`${styles.slotsRowBar} ${c.text}`}>
                    <span className={`${styles.slotsBarTrack} ${c.track}`}>
                      <span
                        className={`${styles.slotsBarFill} ${c.bar}`}
                        style={{ width: `${ratio}%` }}
                      />
                    </span>
                    {totalQty > 0 ? `${pct}%` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(OrderSlotsAccordionBase)
