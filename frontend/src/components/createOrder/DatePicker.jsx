import { memo, useCallback, useMemo, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'
import { createOrderStyles as s } from '../../styles/createOrderStyles'
import useI18n from '../../i18n/useI18n'

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
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

function DatePickerBase({ value, onChange, meta, placeholder }) {
  const { t } = useI18n()
  const formatDate = useCallback(
    (d) => (d ? d.toLocaleDateString(t.locale, t.datePicker.dateFormat) : ''),
    [t],
  )
  const effectivePlaceholder = placeholder ?? t.datePicker.placeholder
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(value || new Date())

  const close = useCallback(() => setOpen(false), [])
  const wrapRef = useClickOutside(open, close)

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const cells = useMemo(() => buildGrid(view), [view])

  const monthLabel = view.toLocaleDateString(t.locale, t.datePicker.monthFormat)

  const prevMonth = () =>
    setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
  const nextMonth = () =>
    setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))

  const pick = (d) => {
    if (!d) return
    onChange?.(d)
    setOpen(false)
  }

  const toggle = () => {
    setOpen((p) => {
      if (!p && value) setView(value)
      return !p
    })
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className={s.dateBtn}>
        <button
          type="button"
          className={s.dateBtnIcon}
          onClick={toggle}
          aria-label={t.datePicker.openAria}
        >
          <Calendar className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={value ? s.dateValue : s.datePlaceholder}
          onClick={toggle}
        >
          {value ? formatDate(value) : effectivePlaceholder}
        </button>
        {meta ? <span className={s.dateMeta}>{meta}</span> : null}
      </div>

      {open ? (
        <div className={`absolute left-0 z-30 ${s.calPanel}`}>
          <div className={s.calHeader}>
            <button
              type="button"
              className={s.calNavBtn}
              onClick={prevMonth}
              aria-label={t.datePicker.prevMonthAria}
            >
              <ChevronLeft className={s.calNavIcon} />
            </button>
            <div className={s.calTitle}>{monthLabel}</div>
            <button
              type="button"
              className={s.calNavBtn}
              onClick={nextMonth}
              aria-label={t.datePicker.nextMonthAria}
            >
              <ChevronRight className={s.calNavIcon} />
            </button>
          </div>

          <div className={s.calGrid}>
            {t.datePicker.dowShort.map((d, i) => (
              <div key={i} className={s.calDow}>
                {d}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d)
                return <div key={`e-${i}`} className={s.calDay} aria-hidden />
              const selected = isSameDay(d, value)
              const isToday = isSameDay(d, today)
              const cls = [
                s.calDay,
                selected ? s.calDaySelected : '',
                !selected && isToday ? s.calDayToday : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  className={cls}
                  onClick={() => pick(d)}
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
              onClick={() => pick(today)}
            >
              {t.datePicker.today}
            </button>
            <button
              type="button"
              className={s.calFootBtn}
              onClick={() => setOpen(false)}
            >
              {t.datePicker.close}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default memo(DatePickerBase)
