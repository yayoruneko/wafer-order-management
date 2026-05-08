import { useCallback, useEffect, useMemo, useState } from 'react'
import zhTW from './dictionaries/zhTW'
import en from './dictionaries/en'
import { DEFAULT_LANG, I18nContext, SUPPORTED_LANGS } from './i18nContext'

const DICTS = { zhTW, en }
const STORAGE_KEY = 'woms.lang'
const SUPPORTED_IDS = new Set(SUPPORTED_LANGS.map((l) => l.id))

function readStoredLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored && SUPPORTED_IDS.has(stored) ? stored : DEFAULT_LANG
}

export default function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang)

  const setLang = useCallback((next) => {
    if (!SUPPORTED_IDS.has(next)) return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
    setLangState(next)
  }, [])

  const t = DICTS[lang] ?? DICTS[DEFAULT_LANG]

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = t.locale
    }
  }, [t.locale])

  const formatDate = useCallback(
    (d) => {
      if (!d) return '—'
      return d.toLocaleDateString(t.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
    [t.locale],
  )

  const value = useMemo(
    () => ({ lang, t, setLang, formatDate }),
    [lang, t, setLang, formatDate],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
