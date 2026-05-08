import { memo } from 'react'
import { styles } from '../../styles/orderListStyles'

function CellBase({ children, className = '' }) {
  return <div className={`${styles.cellBase} ${className}`}>{children}</div>
}

function HeaderCellBase({ children, className = '' }) {
  return <div className={`${styles.cellBase} ${className}`}>{children}</div>
}

export const Cell = memo(CellBase)
export const HeaderCell = memo(HeaderCellBase)
