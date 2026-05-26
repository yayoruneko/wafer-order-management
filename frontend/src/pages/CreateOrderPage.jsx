import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import useCreateOrder from '../hooks/useCreateOrder'
import CustomerSelect from '../components/createOrder/CustomerSelect'
import AddCustomerModal from '../components/createOrder/AddCustomerModal'
import ScheduleDelayAlert from '../components/createOrder/ScheduleDelayAlert'
import DatePicker from '../components/createOrder/DatePicker'
import QuantityInput from '../components/createOrder/QuantityInput'
import FormField from '../components/createOrder/FormField'
import InfoBanner from '../components/createOrder/InfoBanner'
import Spinner from '../components/createOrder/Spinner'
import { createOrderStyles as s } from '../styles/createOrderStyles'
import useI18n from '../i18n/useI18n'

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const {
    customers,
    selectedCustomer,
    selectCustomer,
    addCustomer,
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
    submit,
    cancelCreatedOrder,
  } = useCreateOrder()

  const [addOpen, setAddOpen] = useState(false)
  const [delayInfo, setDelayInfo] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleBack = useCallback(() => navigate('/'), [navigate])
  const handleCancel = useCallback(() => navigate('/'), [navigate])

  const handleSubmit = useCallback(async () => {
    try {
      const result = await submit()
      if (!result) return
      if (result.status === 'ok') {
        toast.success(t.toast.createOrderSuccess, { id: 'create-order' })
        navigate('/')
        return
      }
      const earliestDate = result.earliest
        ? new Date(`${result.earliest}T00:00:00`)
        : null
      setDelayInfo({
        orderId: result.orderId,
        requestedDate: dueDate,
        earliestDate,
        delayDays: result.delayDays,
        scheduleWarning: result.scheduleWarning,
      })
    } catch {
      toast.error(t.toast.genericError, { id: 'create-order' })
    }
  }, [submit, dueDate, navigate, t])

  const handleAcceptDelay = useCallback(async () => {
    if (!delayInfo || accepting || cancelling) return
    setAccepting(true)
    try {
      toast.success(t.toast.createOrderDelaySuccess, { id: 'create-order' })
      setDelayInfo(null)
      navigate('/')
    } finally {
      setAccepting(false)
    }
  }, [delayInfo, accepting, cancelling, navigate, t])

  const handleCancelDelay = useCallback(async () => {
    if (!delayInfo || accepting || cancelling) return
    setCancelling(true)
    try {
      await cancelCreatedOrder(delayInfo.orderId)
      toast.success(t.toast.cancelOrderSuccess(delayInfo.orderId), {
        id: 'create-order',
      })
    } finally {
      setCancelling(false)
      setDelayInfo(null)
      navigate('/')
    }
  }, [delayInfo, accepting, cancelling, cancelCreatedOrder, navigate, t])

  const handleAddCustomer = useCallback(
    async ({ name, code }) => {
      try {
        await addCustomer({ name, code })
        setAddOpen(false)
      } catch (err) {
        toast.error(err?.message ?? t.toast.genericError, { id: 'add-customer' })
      }
    },
    [addCustomer, t],
  )

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <div className={s.headerRow}>
          <button
            type="button"
            className={s.backBtn}
            onClick={handleBack}
            aria-label={t.createOrder.backAria}
          >
            <ArrowLeft className={s.backIcon} />
          </button>
          <div>
            <h1 className={s.pageTitle}>{t.createOrder.title}</h1>
            <p className={s.pageSubtitle}>{t.createOrder.subtitle}</p>
          </div>
        </div>

        <div className={s.card}>
          <div>
            <div className={s.sectionTitle}>{t.createOrder.sectionTitle}</div>
            <div className={s.sectionHint}>{t.createOrder.sectionHint}</div>
          </div>
          <div className={s.divider} />

          <FormField label={t.createOrder.customerLabel}>
            <CustomerSelect
              customers={customers}
              value={selectedCustomer}
              onChange={selectCustomer}
              onRequestAdd={() => setAddOpen(true)}
            />
          </FormField>

          <FormField
            label={t.createOrder.qtyLabel}
            hint={t.createOrder.qtyHint(qtyMin, qtyMax)}
            error={qtyError}
            helpText={qtyError ? t.createOrder.qtyHelp(qtyMin, qtyMax) : null}
            className={s.fieldGap}
          >
            <QuantityInput
              value={qty}
              onChange={updateQty}
              onStep={stepQty}
              hasError={!!qtyError}
            />
          </FormField>

          <FormField
            label={t.createOrder.dueLabel}
            helpText={t.createOrder.leadTimeHelp(leadTime.min, leadTime.max)}
            className={s.fieldGap}
          >
            <DatePicker
              value={dueDate}
              onChange={updateDueDate}
              meta={dueMeta}
            />
          </FormField>

          <InfoBanner>{t.createOrder.infoBanner}</InfoBanner>

          <div className={s.footer}>
            <button
              type="button"
              className={s.cancelBtn}
              onClick={handleCancel}
              disabled={submitting}
            >
              {t.createOrder.cancelBtn}
            </button>
            <button
              type="button"
              className={s.submitBtn}
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  {t.createOrder.submittingBtn}
                </>
              ) : (
                <>
                  {t.createOrder.submitBtn}
                  <ArrowRight className={s.submitIcon} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <AddCustomerModal
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onAdd={handleAddCustomer}
      />

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
