import { memo } from 'react'
import { statusBadge, styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function StatusPillBase({ status }) {
  const { t } = useI18n()
  const variant = statusBadge[status] ?? statusBadge.PENDING
  const label = t.statuses[status] ?? status
  const showDot = status !== 'CANCELLED'
  return (
    <span className={`${styles.statusPill} ${variant.pill}`}>
      {showDot && <span className={`${styles.statusDot} ${variant.dot}`} />}
      {label}
    </span>
  )
}

export default memo(StatusPillBase)
