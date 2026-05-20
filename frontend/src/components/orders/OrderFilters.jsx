import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import FilterInput from './FilterInput'
import FilterSelect from './FilterSelect'
import DateRangePicker from './DateRangePicker'
import useDebouncedCallback from '../../hooks/useDebouncedCallback'
import { STATUS_OPTIONS } from '../../data/sampleOrders'
import { styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

const DEBOUNCE_MS = 500

function toIso(d) {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function OrderFiltersBase({ onSearch, onReset }) {
  const { t } = useI18n()
  const [id, setId] = useState('')
  const [customer, setCustomer] = useState('')
  const [status, setStatus] = useState('ALL')
  const [range, setRange] = useState({ from: null, to: null })

  const localizedStatusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((opt) => ({
        ...opt,
        label: t.statuses[opt.value] ?? opt.label,
      })),
    [t],
  )

  const fireSearch = useCallback(
    (next) => {
      onSearch?.({
        id: next.id.trim(),
        customer: next.customer.trim(),
        status: next.status,
        dateRange: {
          fromIso: toIso(next.range.from),
          toIso: toIso(next.range.to),
        },
      })
    },
    [onSearch],
  )

  const { debounced: debouncedSearch, flush } = useDebouncedCallback(
    fireSearch,
    DEBOUNCE_MS,
  )

  useEffect(() => {
    debouncedSearch({ id, customer, status, range })
  }, [id, customer, status, range, debouncedSearch])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        flush({ id, customer, status, range })
      }
    },
    [flush, id, customer, status, range],
  )

  const handleReset = useCallback(() => {
    setId('')
    setCustomer('')
    setStatus('ALL')
    setRange({ from: null, to: null })
    onReset?.()
  }, [onReset])

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterRow}>
        <FilterInput
          value={id}
          placeholder={t.filters.orderIdPlaceholder}
          onChange={(e) => setId(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <FilterInput
          value={customer}
          placeholder={t.filters.customerPlaceholder}
          onChange={(e) => setCustomer(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={localizedStatusOptions}
        />
        <DateRangePicker value={range} onChange={setRange} />
        <button
          className={styles.primaryBtn}
          onClick={() => flush({ id, customer, status, range })}
        >
          {t.common.search}
        </button>
        <button className={styles.secondaryBtn} onClick={handleReset}>
          {t.filters.resetFilters}
        </button>
      </div>
    </div>
  )
}

export default memo(OrderFiltersBase)
