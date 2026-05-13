import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { calendarStyles as s, loadStyles } from '../../styles/calendarStyles'

function formatCount(n) {
  return n.toLocaleString('en-US')
}

function CalendarDayCellBase({ cell, onOpen }) {
  const ls = loadStyles[cell.load]
  const clickable = cell.hasOrders
  const muted = !cell.inMonth

  const handleClick = () => {
    if (!clickable) return
    onOpen(cell.iso)
  }
  const handleKey = (e) => {
    if (!clickable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(cell.iso)
    }
  }

  const cellBg = muted ? 'bg-stone-50/40' : ls.cellBg
  const accentClass = muted ? 'border-stone-200' : ls.cellOuter

  return (
    <div
      className={`${s.cellOuter} ${accentClass} ${cellBg} ${
        clickable ? s.cellOuterClickable : ''
      }`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={
        clickable
          ? cell.hasDelay
            ? `${cell.iso} 當日 ${cell.orders.length} 筆訂單，含 ${cell.delayedOrders.length} 筆延誤`
            : `${cell.iso} 當日 ${cell.orders.length} 筆訂單`
          : undefined
      }
      onClick={handleClick}
      onKeyDown={handleKey}
    >
      <div className={s.cellHeaderRow}>
        {cell.isToday ? (
          <div className="flex items-center gap-2">
            <span className={s.cellTodayPill}>{cell.day}</span>
            <span className={s.cellTodayLabel}>Today</span>
          </div>
        ) : (
          <span
            className={
              muted
                ? s.cellDayNumMuted
                : cell.load === 'full'
                  ? s.cellDayNumDanger
                  : s.cellDayNum
            }
          >
            {cell.day}
          </span>
        )}
        {cell.hasDelay ? (
          <span className={s.cellAlertIconWrap} aria-hidden="true">
            <AlertTriangle className={s.cellAlertIcon} />
          </span>
        ) : null}
      </div>

      {cell.count > 0 ? (
        <div className="flex flex-col gap-1">
          <div
            className={
              muted
                ? s.cellCountMuted
                : `${s.cellCount} ${ls.countText}`
            }
          >
            {formatCount(cell.count)} / {(cell.capacity / 1000).toLocaleString('en-US')}k
          </div>
          {cell.load === 'full' && !muted ? (
            <div className={s.cellTag}>
              {cell.hasDelay
                ? `${cell.delayedOrders.length} DELAYED`
                : 'AT CAPACITY'}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={s.cellBar}>
        <div
          className={`${s.cellBarFill} ${muted ? ls.barDim : ls.bar}`}
          style={{ width: `${Math.min(100, Math.round(cell.utilization * 100))}%` }}
        />
      </div>
    </div>
  )
}

export default memo(CalendarDayCellBase)
