import { memo } from 'react'
import CalendarDayCell from './CalendarDayCell'
import { calendarStyles as s } from '../../styles/calendarStyles'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function CalendarGridBase({ cells, onOpenDay }) {
  return (
    <div className={s.gridWrap}>
      <div className={s.weekdayRow}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={s.weekdayCell}>
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
