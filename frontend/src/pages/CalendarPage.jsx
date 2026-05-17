import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'
import TopNav from '../components/TopNav'
import useProductionCalendar from '../hooks/useProductionCalendar'
import CalendarStats from '../components/calendar/CalendarStats'
import CalendarToolbar from '../components/calendar/CalendarToolbar'
import CalendarGrid from '../components/calendar/CalendarGrid'
import DelayedOrdersPopover from '../components/calendar/DelayedOrdersPopover'
import useI18n from '../i18n/useI18n'
import { calendarStyles as s } from '../styles/calendarStyles'

export default function CalendarPage() {
  const { t } = useI18n()
  const {
    monthAnchor,
    monthGrid,
    monthSummary,
    factories,
    factoryId,
    setFactoryId,
    selectedDay,
    openDay,
    closeDay,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  } = useProductionCalendar()

  const monthLabel = monthAnchor.toLocaleDateString(
    t.locale,
    t.calendar.monthFormat,
  )

  const handleReschedule = useCallback(() => {
    toast.success(t.toast.rescheduleAllTriggered, { id: 'reschedule-all' })
  }, [t])

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <TopNav />
        <div className={s.headerRow}>
          <div>
            <h1 className={s.pageTitle}>{t.calendar.title}</h1>
            <p className={s.pageSubtitle}>{t.calendar.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={s.rescheduleBtn}
              onClick={handleReschedule}
            >
              <RefreshCw className={s.rescheduleIcon} />
              {t.calendar.rescheduleAll}
            </button>
          </div>
        </div>

        <CalendarStats summary={monthSummary} />

        <CalendarToolbar
          monthLabel={monthLabel}
          factories={factories}
          factoryId={factoryId}
          onChangeFactory={setFactoryId}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />

        <CalendarGrid cells={monthGrid} onOpenDay={openDay} />

        <div className={s.footerHint}>
          <span>{t.calendar.footerHint}</span>
          <span>{t.calendar.lastSync(12)}</span>
        </div>
      </div>

      <DelayedOrdersPopover
        open={!!selectedDay}
        day={selectedDay}
        onClose={closeDay}
      />
    </div>
  )
}
