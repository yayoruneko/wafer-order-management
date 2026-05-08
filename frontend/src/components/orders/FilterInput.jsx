import { forwardRef, memo } from 'react'
import { styles } from '../../styles/orderListStyles'

const FilterInput = forwardRef(function FilterInput(
  { placeholder, defaultValue, value, onChange, onKeyDown },
  ref,
) {
  return (
    <input
      ref={ref}
      type="text"
      placeholder={placeholder}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={styles.filterInput}
    />
  )
})

export default memo(FilterInput)
