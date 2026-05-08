import { useEffect, useRef } from 'react'

export default function useClickOutside(active, onOutside) {
  const ref = useRef(null)
  const handlerRef = useRef(onOutside)

  useEffect(() => {
    handlerRef.current = onOutside
  }, [onOutside])

  useEffect(() => {
    if (!active) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        handlerRef.current?.(e)
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [active])

  return ref
}
