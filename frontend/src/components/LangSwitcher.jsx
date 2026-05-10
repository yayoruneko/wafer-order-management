import { memo, useCallback, useState } from 'react'
import { Languages, Check } from 'lucide-react'
import useClickOutside from '../hooks/useClickOutside'
import useI18n from '../i18n/useI18n'
import { SUPPORTED_LANGS } from '../i18n/i18nContext'

function LangSwitcherBase() {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const wrapRef = useClickOutside(open, close)

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.nav.switchLanguage}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
      >
        <Languages className="h-4 w-4" />
        {SUPPORTED_LANGS.find((l) => l.id === lang)?.label ?? lang}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg"
        >
          {SUPPORTED_LANGS.map((l) => {
            const active = l.id === lang
            return (
              <button
                key={l.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLang(l.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  active ? 'bg-stone-50 text-stone-900' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>{l.label}</span>
                {active ? <Check className="h-4 w-4 text-stone-900" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default memo(LangSwitcherBase)
