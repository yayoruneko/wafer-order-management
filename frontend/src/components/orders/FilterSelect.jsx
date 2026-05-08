import { memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { styles } from '../../styles/orderListStyles'

function FilterSelectBase({ value, onChange, options }) {
  return (
    <div className={styles.filterSelectWrap}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={styles.filterSelect}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className={styles.filterSelectIcon} />
    </div>
  )
}

export default memo(FilterSelectBase)
