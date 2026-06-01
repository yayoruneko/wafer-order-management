import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { formatDate, styles } from '../../styles/orderListStyles'

const FALLBACK_WARNING =
  'Factory capacity exceeded for the requested window. The earliest available expected date has been applied automatically. Confirm with the customer or escalate.'

function relativeFromNow(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  if (diffMs < 0) return 'just now'
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function OrderConflictAccordionBase({ order }) {
  const conflict = order.conflict
  const warning = order.scheduleWarning || FALLBACK_WARNING

  const detectedText = (() => {
    if (!conflict?.detectedAt) return ''
    const rel = relativeFromNow(conflict.detectedAt)
    if (!rel) return ''
    return `Conflict detected ${rel}${conflict.detectedBy ? ` by ${conflict.detectedBy}` : ''}`
  })()

  return (
    <div className={styles.conflictWrap} role="region" aria-label={`Schedule conflict for ${order.id}`}>
      <div className={styles.conflictAccent} />
      <div className={styles.conflictInner}>
        <div className={styles.conflictHeader}>
          <span className={styles.conflictIconWrap}>
            <AlertTriangle className={styles.conflictIcon} />
          </span>
          <div>
            <div className={styles.conflictTitle}>Scheduling conflict</div>
            <p className={styles.conflictBody}>{warning}</p>
          </div>
        </div>

        {conflict ? (
          <div className={styles.conflictMetricsGrid}>
            <div className={styles.conflictMetricCell}>
              <span className={styles.conflictMetricLabel}>Blocking days</span>
              <span className={styles.conflictMetricValue}>
                {formatDate(conflict.blockingFrom)} – {formatDate(conflict.blockingTo)}
              </span>
            </div>
            <div className={styles.conflictMetricCell}>
              <span className={styles.conflictMetricLabel}>Capacity used</span>
              <span
                className={
                  conflict.capacityUsedPct >= 100
                    ? styles.conflictMetricValueDanger
                    : styles.conflictMetricValue
                }
              >
                {conflict.capacityUsedPct}%
                {conflict.factoryId ? ` · ${conflict.factoryId}` : ''}
              </span>
            </div>
            <div className={styles.conflictMetricCell}>
              <span className={styles.conflictMetricLabel}>Conflicting orders</span>
              <span className={styles.conflictMetricValueMono}>
                {(conflict.conflictingOrderIds ?? []).join(', ') || '—'}
                {conflict.moreCount > 0 ? ` + ${conflict.moreCount} more` : ''}
              </span>
            </div>
          </div>
        ) : null}

        {detectedText ? (
          <div className={styles.conflictFooter}>
            <span className={styles.conflictFootnote}>{detectedText}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default memo(OrderConflictAccordionBase)
