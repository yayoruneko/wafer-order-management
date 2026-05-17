import { memo } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, Info } from 'lucide-react'
import { styles } from '../../styles/orderListStyles'

function SortableHeaderBase({
  field,
  children,
  sortField,
  sortDir,
  onSort,
  align = 'left',
  hint,
}) {
  const active = field && sortField === field
  const sortable = !!field
  const justify = align === 'right' ? 'justify-end' : 'justify-start'
  const hintIcon = hint ? (
    <Info className="h-3 w-3 text-stone-400" aria-hidden="true" />
  ) : null

  if (!sortable) {
    return (
      <div className={`flex w-full ${justify}`} title={hint || undefined}>
        <span className={styles.headerCellText}>{children}</span>
        {hintIcon}
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
      title={hint || undefined}
    >
      <span>{children}</span>
      <Icon className={active ? styles.sortIconActive : styles.sortIcon} />
      {hintIcon}
    </button>
  )
}

export default memo(SortableHeaderBase)
