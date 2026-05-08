import { memo, useId, useRef } from 'react'
import { AlertOctagon, X, Factory } from 'lucide-react'
import Modal from '../createOrder/Modal'
import useI18n from '../../i18n/useI18n'
import { formatQty } from '../../styles/orderListStyles'

const MAX_LIST = 5

function CancelOrderDialogBase({
  open,
  mode = 'single',
  order = null,
  inProductionOrders = [],
  totalSelected = 0,
  onClose,
  onConfirm,
}) {
  const { t } = useI18n()
  const titleId = useId()
  const descId = useId()
  const safeBtnRef = useRef(null)

  const isBulk = mode === 'bulk'
  const inProdCount = isBulk ? inProductionOrders.length : 1
  const list = isBulk ? inProductionOrders : order ? [order] : []
  const visible = list.slice(0, MAX_LIST)
  const remaining = Math.max(0, list.length - visible.length)

  const title = isBulk ? t.cancelDialog.titleBulk : t.cancelDialog.titleSingle
  const subtitle = isBulk
    ? t.cancelDialog.subtitleBulk(inProdCount)
    : t.cancelDialog.subtitleSingle
  const confirmLabel = isBulk
    ? t.cancelDialog.confirmBtnBulk(totalSelected)
    : t.cancelDialog.confirmBtn

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-[480px]"
      labelledBy={titleId}
      describedBy={descId}
      initialFocusRef={safeBtnRef}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
          <AlertOctagon className="h-5 w-5 text-red-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div id={titleId} className="text-[16px] font-semibold text-stone-900">
            {title}
          </div>
          <div className="mt-0.5 text-[13px] text-stone-500">{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.cancelDialog.closeAria}
          className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p id={descId} className="mt-4 text-[14px] leading-relaxed text-stone-700">
        {t.cancelDialog.body}
      </p>

      {isBulk && totalSelected > inProdCount ? (
        <p className="mt-2 text-[12px] text-stone-500">
          {t.cancelDialog.bulkBreakdown(inProdCount, totalSelected)}
        </p>
      ) : null}

      {visible.length > 0 ? (
        <div className="mt-4 rounded-lg border border-red-200/70 bg-red-50/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-red-700">
            <Factory className="h-3.5 w-3.5" />
            {t.cancelDialog.affectedHeading}
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {visible.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-mono font-medium text-stone-900">
                    {o.id}
                  </span>
                  <span className="truncate text-stone-600">
                    {o.customerName}
                  </span>
                </span>
                <span className="shrink-0 text-stone-500">
                  {formatQty(o.qty)} {t.cancelDialog.waferUnit}
                </span>
              </li>
            ))}
            {remaining > 0 ? (
              <li className="text-[12px] text-stone-500">
                {t.cancelDialog.moreCount(remaining)}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <p className="mt-3 text-[12px] font-medium text-red-600">
        {t.cancelDialog.irreversibleNote}
      </p>

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-stone-200/70 pt-4">
        <button
          ref={safeBtnRef}
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center rounded-md border border-stone-300 bg-white px-5 text-[14px] font-medium text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-1 transition"
        >
          {t.cancelDialog.cancelBtn}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-red-600 px-5 text-[14px] font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition"
        >
          <AlertOctagon className="h-4 w-4" />
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export default memo(CancelOrderDialogBase)
