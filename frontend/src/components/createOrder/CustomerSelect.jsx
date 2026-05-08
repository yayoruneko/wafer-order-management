import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, Plus } from 'lucide-react'
import CustomerAvatar from './CustomerAvatar'
import useClickOutside from '../../hooks/useClickOutside'
import { createOrderStyles as s } from '../../styles/createOrderStyles'
import useI18n from '../../i18n/useI18n'

function CustomerSelectBase({
  customers,
  value,
  onChange,
  onRequestAdd,
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])
  const wrapRef = useClickOutside(open, close)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    )
  }, [customers, query])

  const handleOpen = () => {
    setOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const pick = (c) => {
    onChange?.(c)
    setQuery('')
    setOpen(false)
  }

  const handleAdd = () => {
    setOpen(false)
    onRequestAdd?.(query)
    setQuery('')
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className={s.inputBase} onClick={open ? undefined : handleOpen}>
        <span className={s.inputIconLeft}>
          <Search className="h-4 w-4" />
        </span>
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.customerSelect.placeholder}
            className={s.inputText}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
              else if (e.key === 'Enter' && filtered[0]) pick(filtered[0])
            }}
          />
        ) : value ? (
          <button
            type="button"
            className="flex h-full flex-1 items-center gap-2 px-2 text-left"
            onClick={handleOpen}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold uppercase text-white"
              style={{ background: value.color }}
              aria-hidden="true"
            >
              {value.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[14px] font-medium text-stone-900">
              {value.name}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wide text-stone-400">
              {value.code}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="flex h-full flex-1 items-center px-2 text-left text-[14px] text-stone-400"
            onClick={handleOpen}
          >
            {t.customerSelect.placeholder}
          </button>
        )}
        <span className={s.inputCaret}>
          <ChevronDown className={s.inputCaretIcon} />
        </span>
      </div>

      {open ? (
        <div className={`absolute left-0 right-0 z-30 ${s.customerPanel}`}>
          <div className="max-h-[260px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className={s.customerEmpty}>
                {t.customerSelect.empty(query)}
              </div>
            ) : (
              filtered.map((c) => {
                const active = value?.code === c.code
                return (
                  <button
                    key={c.code}
                    type="button"
                    className={`${s.customerOption} ${active ? s.customerOptionActive : s.customerOptionIdle}`}
                    onClick={() => pick(c)}
                  >
                    <CustomerAvatar name={c.name} color={c.color} />
                    <div className={s.customerInfo}>
                      <div className={s.customerName}>{c.name}</div>
                      <div className={s.customerCode}>{c.code}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
          <button
            type="button"
            className={s.customerAddRow}
            onClick={handleAdd}
          >
            <Plus className={s.customerAddIcon} />
            {query.trim()
              ? t.customerSelect.addNewWithName(query.trim())
              : t.customerSelect.addNew}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default memo(CustomerSelectBase)
