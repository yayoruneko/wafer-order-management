import { memo, useEffect, useRef } from 'react'
import { styles } from '../../styles/orderListStyles'

function CheckboxBase({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
  disabled = false,
}) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.checked)}
      className={`${styles.checkbox} ${
        disabled ? 'cursor-not-allowed opacity-40' : ''
      }`}
      aria-label={ariaLabel}
    />
  )
}

export default memo(CheckboxBase)
