import { memo } from 'react'
import { calendarStyles as s } from '../../styles/calendarStyles'

const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fullDaysHint(fullDays) {
  if (!fullDays.length) return '本月無滿載日'
  const months = SHORT_MONTH[Number(fullDays[0].iso.split('-')[1]) - 1]
  const days = fullDays.map((d) => d.day).join(', ')
  return `${months} ${days}`
}

function CalendarStatsBase({ summary }) {
  const utilPct = Math.round(summary.avgUtilization * 100)
  const delta = summary.deltaVsPrev
  const deltaText =
    delta === 0
      ? '與上月持平'
      : `${delta > 0 ? '+' : ''}${delta}% vs Apr`

  return (
    <div className={s.statsGrid}>
      <div className={s.statCard}>
        <div className={s.statLabel}>Avg utilization</div>
        <div className={s.statRow}>
          <span className={s.statValue}>{utilPct}%</span>
          <span className={delta >= 0 ? s.statDeltaUp : s.statDeltaDown}>
            {deltaText}
          </span>
        </div>
      </div>

      <div className={s.statCard}>
        <div className={s.statLabel}>Full days</div>
        <div className={s.statRow}>
          <span className={s.statValueRed}>{summary.fullDays.length}</span>
          <span className={s.statHint}>{fullDaysHint(summary.fullDays)}</span>
        </div>
      </div>

      <div className={s.statCard}>
        <div className={s.statLabel}>Near-full days</div>
        <div className={s.statRow}>
          <span className={s.statValueOrange}>{summary.nearFullDays.length}</span>
          <span className={s.statHint}>≥ 90% load</span>
        </div>
      </div>

      <div className={s.statCard}>
        <div className={s.statLabel}>Delayed orders</div>
        <div className={s.statRow}>
          <span className={s.statValueRed}>{summary.delayedOrders.length}</span>
          <span className={s.statHint}>
            {summary.delayedOrders.length > 0 ? 'action needed' : 'no action'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(CalendarStatsBase)
