import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCcw,
  Lock,
  Pencil,
  Check,
  Info,
  Save,
} from 'lucide-react'
import useEditOrder from '../hooks/useEditOrder'
import FormField from '../components/createOrder/FormField'
import QuantityInput from '../components/createOrder/QuantityInput'
import DatePicker from '../components/createOrder/DatePicker'
import CustomerAvatar from '../components/createOrder/CustomerAvatar'
import ScheduleDelayAlert from '../components/createOrder/ScheduleDelayAlert'
import Spinner from '../components/createOrder/Spinner'
import { createOrderStyles as s } from '../styles/createOrderStyles'
import { editOrderStyles as e } from '../styles/editOrderStyles'
import { statusBadge, styles as ls } from '../styles/orderListStyles'
import useI18n from '../i18n/useI18n'

export default function EditOrderPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t, formatDate } = useI18n()
  const relativeMinutes = useCallback(
    (date) => {
      if (!date) return ''
      const diff = Math.max(1, Math.round((Date.now() - date.getTime()) / 60_000))
      return t.editOrder.minutesAgo(diff)
    },
    [t],
  )
  const formatCreated = useCallback(
    (iso) => {
      if (!iso) return '—'
      const d = new Date(`${iso}T00:00:00`)
      if (Number.isNaN(d.getTime())) return iso
      return formatDate(d)
    },
    [formatDate],
  )
  const {
    order,
    loading,
    stale,
    qty,
    qtyError,
    qtyMin,
    qtyMax,
    updateQty,
    stepQty,
    dueDate,
    dueMeta,
    updateDueDate,
    leadTime,
    canSubmit,
    submitting,
    reloading,
    reload,
    submit,
    submitWithAcceptedDate,
    conflicted,
    clearConflict,
    reloadAndClearConflict,
  } = useEditOrder(id)

  const [delayInfo, setDelayInfo] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [saveHovered, setSaveHovered] = useState(false)

  const handleBack = useCallback(() => navigate('/'), [navigate])

  const toastId = `update-${id}`

  const handleSubmit = useCallback(async () => {
    try {
      const result = await submit()
      if (!result) return
      if (result.status === 'ok') {
        toast.success(t.toast.updateOrderSuccess(id), { id: toastId })
        navigate('/')
        return
      }
      setDelayInfo({
        requestedDate: dueDate,
        earliestDate: result.earliest,
        delayDays: result.delayDays,
        conflictingOrders: result.conflictingOrders,
        scheduleWarning: result.scheduleWarning,
      })
    } catch {
      toast.error(t.toast.genericError, { id: toastId })
    }
  }, [submit, dueDate, navigate, id, toastId, t])

  const handleAcceptDelay = useCallback(async () => {
    if (!delayInfo || accepting || cancelling) return
    setAccepting(true)
    try {
      await submitWithAcceptedDate()
      toast.success(t.toast.updateOrderSuccess(id), { id: toastId })
      setDelayInfo(null)
      navigate('/')
    } catch {
      toast.error(t.toast.genericError, { id: toastId })
    } finally {
      setAccepting(false)
    }
  }, [delayInfo, accepting, cancelling, submitWithAcceptedDate, navigate, id, toastId, t])

  const handleCancelDelay = useCallback(async () => {
    if (accepting || cancelling) return
    setCancelling(true)
    await new Promise((r) => setTimeout(r, 300))
    setCancelling(false)
    setDelayInfo(null)
  }, [accepting, cancelling])

  if (loading || !order) {
    return (
      <div className={s.page}>
        <div className={`${s.shell} items-center justify-center py-20`}>
          <Spinner className="h-5 w-5 text-stone-500" />
        </div>
      </div>
    )
  }

  const status = order.status
  const badge = statusBadge[status] ?? statusBadge.PENDING
  const qtyNumeric = Number(String(qty).replace(/,/g, ''))
  const qtyWithinRange =
    qty !== '' &&
    Number.isFinite(qtyNumeric) &&
    qtyNumeric >= qtyMin &&
    qtyNumeric <= qtyMax

  // Show inline qty error in FormField only after the user dirties the field;
  // the "required" message would otherwise flash before they typed anything.
  const visibleQtyError =
    qtyError && qtyError !== t.editOrder.qtyRequired ? qtyError : null

  const saveDisabled = !canSubmit
  const showSaveTooltip = stale && saveHovered

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <nav className={e.breadcrumb} aria-label="Breadcrumb">
          <button
            type="button"
            className="hover:text-stone-700 transition"
            onClick={handleBack}
          >
            {t.editOrder.breadcrumbRoot}
          </button>
          <span className={e.breadcrumbSep}>›</span>
          <span className="font-mono text-stone-500">{order.id}</span>
          <span className={e.breadcrumbSep}>›</span>
          <span className={e.breadcrumbCurrent}>{t.editOrder.breadcrumbEdit}</span>
        </nav>

        <div className={e.headerRow}>
          <button
            type="button"
            className={e.backBtn}
            onClick={handleBack}
            aria-label={t.editOrder.backAria}
          >
            <ArrowLeft className={e.backIcon} />
          </button>
          <div className="min-w-0">
            <div className={e.titleRow}>
              <h1 className={e.title}>{t.editOrder.title}</h1>
              <span className={e.idChip}>{order.id}</span>
            </div>
            <p className={e.subtitle}>{t.editOrder.subtitle}</p>
          </div>
        </div>

        {stale ? (
          <div className={e.staleBanner} role="alert">
            <div className={e.staleIconWrap}>
              <AlertTriangle className={e.staleIcon} />
            </div>
            <div className={e.staleBody}>
              <div className={e.staleTitleRow}>
                <span className={e.staleTitle}>{t.editOrder.staleTitle}</span>
                <span className={e.stalePill}>
                  {relativeMinutes(order.lastEditAt)}
                </span>
              </div>
              <p className={e.staleText}>
                {t.editOrder.staleBodyPrefix}
                <span className={e.staleEditor}>{order.lastEditBy}</span>
                {t.editOrder.staleBodySuffix}
              </p>
            </div>
            <button
              type="button"
              className={e.staleReloadBtn}
              onClick={reload}
              disabled={reloading}
            >
              {reloading ? (
                <Spinner className={e.staleReloadIcon} />
              ) : (
                <RefreshCcw className={e.staleReloadIcon} />
              )}
              {reloading ? t.editOrder.reloadingBtn : t.editOrder.staleReload}
            </button>
          </div>
        ) : null}

        <div className={s.card}>
          <div className={e.roCard}>
            <div className={e.roHeader}>
              <Lock className={e.roHeaderIcon} />
              {t.editOrder.readOnlyTag}
            </div>

            <div className={e.roGrid}>
              <div>
                <div className={e.roLabel}>{t.editOrder.customerLabel}</div>
                <div className={e.roCustomerRow}>
                  <CustomerAvatar
                    name={order.customerName}
                    color={order.customerColor}
                  />
                  <div className="min-w-0">
                    <div className={e.roCustomerName}>{order.customerName}</div>
                    <div className={e.roCustomerCode}>{order.customerCode}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className={e.roLabel}>{t.editOrder.statusLabel}</div>
                <div className={e.roStatusRow}>
                  <span className={`${ls.statusPill} ${badge.pill}`}>
                    <span className={`${ls.statusDot} ${badge.dot}`} />
                    {status}
                  </span>
                </div>
              </div>
            </div>

            <div className={e.roMetaDivider} />
            <div className={e.roMeta}>
              <span>
                {t.editOrder.createdLabel}{' '}
                <span className={e.roMetaStrong}>
                  {formatCreated(order.createdAt)}
                </span>
              </span>
              <span className={e.roMetaDot}>•</span>
              <span>
                {t.editOrder.lastEditLabel}{' '}
                <span className={e.roMetaStrong}>
                  {relativeMinutes(order.lastEditAt)}
                </span>
                {t.editOrder.byLabel}
                <span className={e.roMetaStrong}>{order.lastEditBy}</span>
              </span>
            </div>
          </div>

          <div className="mt-7">
            <div className={e.editableHeader}>
              <Pencil className={e.editableHeaderIcon} />
              {t.editOrder.editableTag}
            </div>
          </div>

          <FormField
            label={t.editOrder.qtyLabel}
            hint={t.editOrder.qtyRange(qtyMin, qtyMax)}
            error={visibleQtyError}
            className="mt-3"
          >
            <div className={e.qtySuffixWrap}>
              <QuantityInput
                value={qty}
                onChange={updateQty}
                onStep={stepQty}
                hasError={!!visibleQtyError}
              />
              <span className={e.qtySuffix}>{t.editOrder.qtySuffix}</span>
            </div>
            <div className={e.helpRow}>
              <span className={e.helpRowText}>
                {t.editOrder.qtyHelp(qtyMin, qtyMax)}
              </span>
              {qtyWithinRange && !visibleQtyError ? (
                <>
                  <span className={e.helpRowDot}>•</span>
                  <span className={e.helpRowOk}>
                    <Check className={e.helpRowOkIcon} />
                    {t.editOrder.qtyWithinRange}
                  </span>
                </>
              ) : null}
            </div>
          </FormField>

          <FormField
            label={t.editOrder.dueLabel}
            helpText={t.editOrder.leadTimeHelp(leadTime.min, leadTime.max)}
            className={s.fieldGap}
          >
            <DatePicker
              value={dueDate}
              onChange={updateDueDate}
              meta={dueMeta}
            />
          </FormField>

          <div className="mt-6">
            <div className={e.warningBox} role="note">
              <Info className={e.warningIcon} />
              <p className={e.warningText}>{t.editOrder.scheduleWarning}</p>
            </div>
          </div>

          <div className={e.footer}>
            <div className={e.footerLeft}>
              <button
                type="button"
                className={s.cancelBtn}
                onClick={handleBack}
                disabled={submitting}
              >
                {t.editOrder.cancelBtn}
              </button>
            </div>
            <div className={e.footerRight}>
              <div
                className={e.saveWrap}
                onMouseEnter={() => setSaveHovered(true)}
                onMouseLeave={() => setSaveHovered(false)}
              >
                {showSaveTooltip ? (
                  <span className={e.saveTooltip} role="tooltip">
                    <span className={e.saveTooltipArrow} aria-hidden />
                    {t.editOrder.saveDisabledTooltip}
                  </span>
                ) : null}
                <button
                  type="button"
                  className={s.submitBtn}
                  onClick={handleSubmit}
                  disabled={saveDisabled}
                  aria-disabled={saveDisabled}
                  title={
                    stale && !submitting
                      ? t.editOrder.saveDisabledTooltip
                      : undefined
                  }
                >
                  {submitting ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      {t.editOrder.savingBtn}
                    </>
                  ) : (
                    <>
                      {stale ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t.editOrder.saveBtn}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {conflicted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-stone-900">
                  {t.editOrder.conflictTitle}
                </h2>
                <p className="mt-1 text-[13px] text-stone-600">
                  {t.editOrder.conflictBody}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={clearConflict}
                className="inline-flex h-9 items-center rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={reloadAndClearConflict}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800 transition"
              >
                <RefreshCcw className="h-4 w-4" />
                {t.editOrder.conflictReload}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ScheduleDelayAlert
        open={!!delayInfo}
        requestedDate={delayInfo?.requestedDate}
        earliestDate={delayInfo?.earliestDate}
        delayDays={delayInfo?.delayDays ?? 0}
        conflictingOrders={delayInfo?.conflictingOrders ?? 0}
        scheduleWarning={delayInfo?.scheduleWarning}
        accepting={accepting}
        cancelling={cancelling}
        onCancel={handleCancelDelay}
        onAccept={handleAcceptDelay}
      />
    </div>
  )
}
