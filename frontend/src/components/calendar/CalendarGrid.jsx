import { memo } from 'react'
import CalendarDayCell from './CalendarDayCell'
import useI18n from '../../i18n/useI18n'
import { calendarStyles as s } from '../../styles/calendarStyles'

function CalendarGridBase({ cells, onOpenDay }) {
  const { t } = useI18n()
  return (
    <div className={s.gridWrap}>
      <div className={s.weekdayRow}>
        {t.calendar.weekdays.map((w, i) => (
          <div key={i} className={s.weekdayCell}>
            {w}
          </div>
        ))}
      </div>
      <div className={s.monthGrid}>
        {cells.map((cell) => (
          <CalendarDayCell key={cell.iso} cell={cell} onOpen={onOpenDay} />
        ))}
      </div>
    </div>
  )
}

export default memo(CalendarGridBase)
