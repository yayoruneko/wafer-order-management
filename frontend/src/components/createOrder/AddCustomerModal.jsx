import { memo, useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import { createOrderStyles as s } from '../../styles/createOrderStyles'
import useI18n from '../../i18n/useI18n'

function AddCustomerModalBase({ open, onCancel, onAdd }) {
  const { t } = useI18n()
  const nameRef = useRef(null)
  const codeRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      const id = requestAnimationFrame(() => nameRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  const handleAdd = () => {
    const name = nameRef.current?.value ?? ''
    const code = codeRef.current?.value ?? ''
    if (!name.trim()) {
      setError(t.addCustomer.nameRequired)
      nameRef.current?.focus()
      return
    }
    onAdd?.({ name, code })
    if (nameRef.current) nameRef.current.value = ''
    if (codeRef.current) codeRef.current.value = ''
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleAdd()
    else if (e.key === 'Escape') onCancel?.()
  }

  return (
    <Modal open={open} onClose={onCancel} width="max-w-[420px]">
      <div className={s.modalTitle}>{t.addCustomer.title}</div>
      <div className={s.modalHint}>{t.addCustomer.hint}</div>

      <div className={s.modalRow}>
        <label className={s.modalLabel}>{t.addCustomer.nameLabel}</label>
        <input
          ref={nameRef}
          className={s.modalInput}
          placeholder={t.addCustomer.namePlaceholder}
          onKeyDown={handleKey}
        />
      </div>

      <div className={s.modalRow}>
        <label className={s.modalLabel}>{t.addCustomer.codeLabel}</label>
        <input
          ref={codeRef}
          className={s.modalInput}
          placeholder={t.addCustomer.codePlaceholder}
          onKeyDown={handleKey}
        />
      </div>

      {error ? (
        <div className="mt-2 text-[12px] font-medium text-red-600">
          {error}
        </div>
      ) : null}

      <div className={s.modalActions}>
        <button className={s.cancelBtn} onClick={onCancel} type="button">
          {t.addCustomer.cancel}
        </button>
        <button className={s.submitBtn} onClick={handleAdd} type="button">
          {t.addCustomer.add}
        </button>
      </div>
    </Modal>
  )
}

export default memo(AddCustomerModalBase)
