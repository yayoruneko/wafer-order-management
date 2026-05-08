import { memo } from 'react'
import { styles } from '../../styles/orderListStyles'

function initials(name) {
  if (!name) return '?'
  const trimmed = name.trim()
  if (trimmed.length <= 2) return trimmed.toUpperCase()
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

function CustomerLogoBase({ name, color = '#64748b', dimmed = false }) {
  return (
    <div
      className={styles.customerLogo}
      style={{
        background: dimmed ? '#D6D3D1' : color,
        opacity: dimmed ? 0.6 : 1,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}

export default memo(CustomerLogoBase)
