import { memo } from 'react'
import useI18n from '../../i18n/useI18n'
import { calendarStyles as s } from '../../styles/calendarStyles'

function CalendarStatsBase({ summary }) {
  const { t } = useI18n()
  const st = t.calendar.stats
  const utilPct = Math.round(summary.avgUtilization * 100)
  const delta = summary.deltaVsPrev
  const deltaText = delta === 0 ? st.flatVsPrev : st.deltaVsPrev(delta)

  const fullDaysHint = () => {
    const days = summary.fullDays
    if (!days.length) return st.noFullDays
    const month = days[0].date.toLocaleDateString(t.locale, { month: 'short' })
    const list = days.map((d) => d.day).join(', ')
    return st.fullDaysHint(month, list)
  }

  return (
    <div className={s.statsGrid}>
      <div className={s.statCard}>
        <div className={s.statLabel}>{st.avgUtilization}</div>
        <div className={s.statRow}>
          <span className={s.statValue}>{utilPct}%</span>
          <span className={delta >= 0 ? s.statDeltaUp : s.statDeltaDown}>
            {deltaText}
          </span>
        </div>
      </div>

      <div className={s.statCard}>
        <div className={s.statLabel}>{st.fullDays}</div>
        <div className={s.statRow}>
          <span className={s.statValueRed}>{summary.fullDays.length}</span>
          <span className={s.statHint}>{fullDaysHint()}</span>
        </div>
      </div>

      <div className={s.statCard}>
        <div className={s.statLabel}>{st.nearFullDays}</div>
        <div className={s.statRow}>
          <span className={s.statValueOrange}>{summary.nearFullDays.length}</span>
          <span className={s.statHint}>{st.nearFullHint}</span>
        </div>
      </div>

      <div className={s.statCard}>
        <div className={s.statLabel}>{st.delayedOrders}</div>
        <div className={s.statRow}>
          <span className={s.statValueRed}>{summary.delayedOrders.length}</span>
          <span className={s.statHint}>
            {summary.delayedOrders.length > 0 ? st.actionNeeded : st.noAction}
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(CalendarStatsBase)
