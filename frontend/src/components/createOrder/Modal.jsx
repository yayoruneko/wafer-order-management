import { memo, useEffect, useRef } from 'react'
import { createOrderStyles as s } from '../../styles/createOrderStyles'

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function getFocusables(root) {
  if (!root) return []
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
  )
}

function ModalBase({
  open,
  onClose,
  children,
  width = 'max-w-[480px]',
  labelledBy,
  describedBy,
  initialFocusRef,
}) {
  const cardRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement

    const focusInitial = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
        return
      }
      const focusables = getFocusables(cardRef.current)
      focusables[0]?.focus()
    }
    const raf = requestAnimationFrame(focusInitial)

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = getFocusables(cardRef.current)
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !cardRef.current?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      const previous = previouslyFocusedRef.current
      if (previous && typeof previous.focus === 'function') {
        previous.focus()
      }
    }
  }, [open, onClose, initialFocusRef])

  if (!open) return null

  return (
    <div
      className={s.modalScrim}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div ref={cardRef} className={`${s.modalCard} ${width}`}>
        {children}
      </div>
    </div>
  )
}

export default memo(ModalBase)
