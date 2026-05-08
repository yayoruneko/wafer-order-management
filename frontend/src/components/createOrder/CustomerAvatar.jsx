import { memo } from 'react'
import { createOrderStyles as s } from '../../styles/createOrderStyles'

function initials(name) {
  if (!name) return '?'
  const trimmed = name.trim()
  if (trimmed.length <= 2) return trimmed.toUpperCase()
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return trimmed.slice(0, 2).toUpperCase()
}

function CustomerAvatarBase({ name, color = '#64748b' }) {
  return (
    <div
      className={s.customerLogo}
      style={{ background: color }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}

export default memo(CustomerAvatarBase)
