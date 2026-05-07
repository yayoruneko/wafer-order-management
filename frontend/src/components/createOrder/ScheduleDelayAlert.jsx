import { memo } from 'react'
import { AlertTriangle, Calendar, Clock, ArrowDown, Info, Check } from 'lucide-react'
import Modal from './Modal'
import Spinner from './Spinner'
import { createOrderStyles as s } from '../../styles/createOrderStyles'
import useI18n from '../../i18n/useI18n'

function ScheduleDelayAlertBase({
  open,
  requestedDate,
  earliestDate,
  delayDays,
  conflictingOrders,
  scheduleWarning,
  accepting = false,
  cancelling = false,
  onCancel,
  onAccept,
}) {
  const { t, formatDate } = useI18n()
  const busy = accepting || cancelling
  const warning =
    scheduleWarning || t.scheduleAlert.defaultWarning(conflictingOrders ?? 0)

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      width="max-w-[480px]"
    >
      <div className={s.alertHeader}>
        <div className={s.alertIconWrap}>
          <AlertTriangle className={s.alertIcon} />
        </div>
        <div>
          <div className={s.alertTitle}>{t.scheduleAlert.title}</div>
          <div className={s.alertSubtitle}>{t.scheduleAlert.subtitle}</div>
        </div>
      </div>

      <p className={s.alertBody}>{t.scheduleAlert.body}</p>

      <div className={s.alertCompare}>
        <div className={s.alertCompareRow}>
          <span className={s.alertCompareLabel}>
            <Calendar className={s.alertCompareIcon} />
            {t.scheduleAlert.requestedDate}
          </span>
          <span className={s.alertCompareDate}>{formatDate(requestedDate)}</span>
        </div>

        <div className={s.alertCompareDivider}>
          <span className={s.alertDelayPill}>
            <ArrowDown className={s.alertDelayIcon} />
            {t.scheduleAlert.delayPill(delayDays)}
          </span>
        </div>

        <div className={s.alertCompareRow}>
          <span className={s.alertCompareLabelDanger}>
            <Clock className={s.alertCompareIconDanger} />
            {t.scheduleAlert.earliestDate}
          </span>
          <span className={s.alertCompareDateDanger}>
            {formatDate(earliestDate)}
          </span>
        </div>
      </div>

      <div className={s.alertFootnote}>
        <Info className={s.alertFootnoteIcon} />
        <span>{warning}</span>
      </div>

      <div className={s.alertActions}>
        <button
          type="button"
          className={s.cancelBtn}
          onClick={onCancel}
          disabled={busy}
        >
          {cancelling ? (
            <>
              <Spinner className="h-4 w-4" />
              {t.scheduleAlert.cancelling}
            </>
          ) : (
            t.scheduleAlert.cancel
          )}
        </button>
        <button
          type="button"
          className={s.alertAcceptBtn}
          onClick={onAccept}
          disabled={busy}
        >
          {accepting ? (
            <>
              <Spinner className="h-4 w-4" />
              {t.scheduleAlert.accepting}
            </>
          ) : (
            <>
              <Check className={s.alertAcceptIcon} />
              {t.scheduleAlert.accept}
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}

export default memo(ScheduleDelayAlertBase)
