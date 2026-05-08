import { useCallback, useEffect, useRef } from 'react'

export default function useDebouncedCallback(callback, delay = 500) {
  const callbackRef = useRef(callback)
  const timerRef = useRef(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        callbackRef.current?.(...args)
      }, delay)
    },
    [delay],
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const flush = useCallback((...args) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    callbackRef.current?.(...args)
  }, [])

  return { debounced, cancel, flush }
}
