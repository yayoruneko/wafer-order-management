import { memo, useRef } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { createOrderStyles as s } from '../../styles/createOrderStyles'
import useI18n from '../../i18n/useI18n'

function QuantityInputBase({
  value,
  onChange,
  onStep,
  hasError,
  placeholder = '25',
}) {
  const { t } = useI18n()
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^\d,]/g, '')
    onChange?.(raw.replace(/,/g, ''))
  }

  const display = (() => {
    if (value === '' || value == null) return ''
    const n = Number(value)
    if (!Number.isFinite(n)) return String(value)
    return n.toLocaleString('en-US')
  })()

  return (
    <div
      className={`${s.qtyRow} ${hasError ? s.qtyRowErr : s.qtyRowOk}`}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={s.qtyInput}
      />
      <div className={s.qtyStepperWrap}>
        <button
          type="button"
          tabIndex={-1}
          className={s.qtyStepperBtn}
          onClick={(e) => {
            e.stopPropagation()
            onStep?.(1)
          }}
          aria-label={t.quantity.increase}
        >
          <ChevronUp className={s.qtyStepperIcon} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          className={`${s.qtyStepperBtn} border-t border-stone-200`}
          onClick={(e) => {
            e.stopPropagation()
            onStep?.(-1)
          }}
          aria-label={t.quantity.decrease}
        >
          <ChevronDown className={s.qtyStepperIcon} />
        </button>
      </div>
    </div>
  )
}

export default memo(QuantityInputBase)
