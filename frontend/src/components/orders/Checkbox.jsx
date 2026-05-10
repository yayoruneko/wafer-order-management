import { memo, useEffect, useRef } from 'react'
import { styles } from '../../styles/orderListStyles'

function CheckboxBase({ checked, indeterminate = false, onChange, ariaLabel }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      className={styles.checkbox}
      aria-label={ariaLabel}
    />
  )
}

export default memo(CheckboxBase)
