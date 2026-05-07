import { memo } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { styles } from '../../styles/orderListStyles'

function SortableHeaderBase({
  field,
  children,
  sortField,
  sortDir,
  onSort,
  align = 'left',
}) {
  const active = field && sortField === field
  const sortable = !!field
  const justify = align === 'right' ? 'justify-end' : 'justify-start'

  if (!sortable) {
    return (
      <div className={`flex w-full ${justify}`}>
        <span className={styles.headerCellText}>{children}</span>
      </div>
    )
  }

  const Icon = active
    ? sortDir === 'asc'
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown

  return (
    <button
      type="button"
      onClick={() => onSort?.(field)}
      className={`flex w-full ${justify} ${styles.headerCellBtn}`}
    >
      <span>{children}</span>
      <Icon className={active ? styles.sortIconActive : styles.sortIcon} />
    </button>
  )
}

export default memo(SortableHeaderBase)
