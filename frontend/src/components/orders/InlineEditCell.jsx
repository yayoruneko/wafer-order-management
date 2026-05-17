import { memo, useEffect, useRef, useState } from 'react'
import { styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function InlineEditCellBase({
  value,
  display,
  type = 'text',
  disabled = false,
  textClassName = '',
  onCommit,
}) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  if (disabled) {
    return <span className={textClassName}>{display ?? value ?? '—'}</span>
  }

  if (!editing) {
    return (
      <span
        className={`${textClassName} ${styles.inlineEditable}`}
        onDoubleClick={() => {
          setDraft(String(value ?? ''))
          setEditing(true)
        }}
        title={t.orderList.editHint}
      >
        {display ?? value ?? '—'}
      </span>
    )
  }

  const commit = () => {
    setEditing(false)
    if (draft !== String(value ?? '')) onCommit?.(draft)
  }

  const cancel = () => {
    setEditing(false)
    setDraft('')
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        else if (e.key === 'Escape') cancel()
      }}
      className={styles.inlineInput}
    />
  )
}

export default memo(InlineEditCellBase)
