import { memo, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'
import { calendarStyles as s } from '../../styles/calendarStyles'

function CalendarToolbarBase({
  monthLabel,
  factories,
  factoryId,
  onChangeFactory,
  view,
  onChangeView,
  onPrevMonth,
  onNextMonth,
  onToday,
}) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))
  const factory = factories.find((f) => f.id === factoryId) ?? factories[0]

  return (
    <div className={s.toolbar}>
      <div className={s.toolbarLeft}>
        <button
          type="button"
          className={s.navBtn}
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className={s.navIcon} />
        </button>
        <div className={s.monthLabel}>{monthLabel}</div>
        <button
          type="button"
          className={s.navBtn}
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className={s.navIcon} />
        </button>
        <button type="button" className={s.todayBtn} onClick={onToday}>
          Today
        </button>
      </div>

      <div className={s.toolbarMid}>
        <span className={s.factoryLabel}>Factory</span>
        <div className={s.factoryWrap} ref={ref}>
          <button
            type="button"
            className={s.factoryBtn}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span
              className={`${s.factoryDot} ${
                factory.status === 'maintenance' ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
            />
            <span>{factory.name}</span>
            <ChevronDown className={s.factoryCaret} />
          </button>
          {open ? (
            <div className={s.factoryMenu} role="listbox">
              {factories.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="option"
                  aria-selected={f.id === factoryId}
                  className={`${s.factoryItem} ${
                    f.id === factoryId ? s.factoryItemActive : ''
                  }`}
                  onClick={() => {
                    onChangeFactory(f.id)
                    setOpen(false)
                  }}
                >
                  <span
                    className={`${s.factoryDot} ${
                      f.status === 'maintenance' ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}
                  />
                  {f.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className={s.toolbarRight}>
        <div className={s.viewSwitch} role="tablist">
          {['month', 'week', 'list'].map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={view === v ? s.viewBtnActive : s.viewBtn}
              onClick={() => onChangeView(v)}
            >
              {v === 'month' ? 'Month' : v === 'week' ? 'Week' : 'List'}
            </button>
          ))}
        </div>
        <span className={s.legendItem}>
          <span className={`${s.legendDot} bg-emerald-500`} />
          Normal
        </span>
      </div>
    </div>
  )
}

export default memo(CalendarToolbarBase)
