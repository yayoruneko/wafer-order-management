import { memo } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function ScheduleCellBase({
  status,
  delayedDays,
  expandable = false,
  expanded = false,
  onToggle,
  orderId,
}) {
  const { t } = useI18n()
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return <span className={styles.cellMuted}>—</span>
  }
  if (delayedDays > 0) {
    const label = t.schedule.delayedDays(delayedDays)
    if (expandable) {
      return (
        <button
          type="button"
          className={styles.schedDelayedBtn}
          onClick={(e) => {
            e.stopPropagation()
            onToggle?.()
          }}
          aria-expanded={expanded}
          aria-controls={orderId ? `conflict-${orderId}` : undefined}
          title={expanded ? t.schedule.hideConflict : t.schedule.showConflict}
        >
          <AlertTriangle className={styles.schedDelayedIcon} />
          {label}
          <ChevronDown
            className={expanded ? styles.schedExpandIconOpen : styles.schedExpandIcon}
          />
        </button>
      )
    }
    return (
      <span className={styles.schedDelayed}>
        <AlertTriangle className={styles.schedDelayedIcon} />
        {label}
      </span>
    )
  }
  return <span className={styles.schedOk}>{t.schedule.onTrack}</span>
}

export default memo(ScheduleCellBase)
