import { memo, useCallback, useMemo, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'
import { dateRangePickerStyles as s } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function buildGrid(viewDate) {
  const first = startOfMonth(viewDate)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const MONTH_FMT = { month: 'long', year: 'numeric' }
const SHORT_FMT = { month: 'short', day: 'numeric' }
const FULL_FMT = { month: 'short', day: 'numeric', year: 'numeric' }

function formatRange(from, to, locale) {
  if (!from && !to) return ''
  const sameYear = from && to && from.getFullYear() === to.getFullYear()
  const f = from
    ? from.toLocaleDateString(locale, sameYear ? SHORT_FMT : FULL_FMT)
    : ''
  const tStr = to
    ? to.toLocaleDateString(locale, sameYear ? SHORT_FMT : FULL_FMT)
    : ''
  if (from && to) return `${f} – ${tStr}`
  if (from) return `${f} – …`
  return `… – ${tStr}`
}

function DateRangePickerBase({ value, onChange, placeholder }) {
  const { t } = useI18n()
  const from = value?.from || null
  const to = value?.to || null
  const effectivePlaceholder = placeholder ?? t.filters.dateRangePlaceholder

  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => from || new Date())
  const [hover, setHover] = useState(null)

  const close = useCallback(() => {
    setOpen(false)
    setHover(null)
  }, [])
  const wrapRef = useClickOutside(open, close)

  const cells = useMemo(() => buildGrid(view), [view])
  const monthLabel = view.toLocaleDateString(t.locale, MONTH_FMT)

  const today = useMemo(() => startOfDay(new Date()), [])

  const prevMonth = () =>
    setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
  const nextMonth = () =>
    setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))

  const pick = (d) => {
    if (!d) return
    const day = startOfDay(d)
    if (!from || (from && to)) {
      onChange?.({ from: day, to: null })
      return
    }
    if (day < from) {
      onChange?.({ from: day, to: from })
      setOpen(false)
      return
    }
    onChange?.({ from, to: day })
    setOpen(false)
  }

  const toggle = () => {
    setOpen((p) => {
      if (!p) setView(from || new Date())
      return !p
    })
  }

  const clear = (e) => {
    e?.stopPropagation()
    onChange?.({ from: null, to: null })
    setHover(null)
  }

  const inPreviewRange = (d) => {
    if (!from || to || !hover) return false
    const lo = from < hover ? from : hover
    const hi = from < hover ? hover : from
    return d > lo && d < hi
  }

  const inRange = (d) => {
    if (!from || !to) return false
    return d > from && d < to
  }

  const label = formatRange(from, to, t.locale)

  return (
    <div ref={wrapRef} className={s.wrap}>
      <button
        type="button"
        onClick={toggle}
        className={`${s.trigger} ${open ? s.triggerActive : ''}`}
      >
        <Calendar className={s.triggerIcon} />
        <span className={label ? s.triggerValue : s.triggerPlaceholder}>
          {label || effectivePlaceholder}
        </span>
        {label ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={t.filters.clearDateRangeAria}
            onClick={clear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') clear(e)
            }}
            className={s.clearBtn}
          >
            <X className={s.clearIcon} />
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={s.panel}>
          <div className={s.calHeader}>
            <button
              type="button"
              className={s.calNavBtn}
              onClick={prevMonth}
              aria-label={t.filters.prevMonthAria}
            >
              <ChevronLeft className={s.calNavIcon} />
            </button>
            <div className={s.calTitle}>{monthLabel}</div>
            <button
              type="button"
              className={s.calNavBtn}
              onClick={nextMonth}
              aria-label={t.filters.nextMonthAria}
            >
              <ChevronRight className={s.calNavIcon} />
            </button>
          </div>

          <div className={s.calGrid}>
            {t.filters.dowShort.map((d, i) => (
              <div key={i} className={s.calDow}>
                {d}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d)
                return <div key={`e-${i}`} className={s.calDay} aria-hidden />
              const isFrom = isSameDay(d, from)
              const isTo = isSameDay(d, to)
              const isEdge = isFrom || isTo
              const within = inRange(d)
              const preview = inPreviewRange(d)
              const isToday = isSameDay(d, today)

              const cls = [
                s.calDay,
                isEdge ? s.calDayEdge : '',
                within ? s.calDayWithin : '',
                preview ? s.calDayPreview : '',
                !isEdge && isToday ? s.calDayToday : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  className={cls}
                  onClick={() => pick(d)}
                  onMouseEnter={() => from && !to && setHover(startOfDay(d))}
                  onMouseLeave={() => setHover(null)}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          <div className={s.calFooter}>
            <button
              type="button"
              className={s.calFootBtn}
              onClick={() => {
                onChange?.({ from: null, to: null })
                setHover(null)
              }}
            >
              {t.common.clear}
            </button>
            <button
              type="button"
              className={s.calFootBtn}
              onClick={close}
            >
              {t.common.done}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default memo(DateRangePickerBase)
