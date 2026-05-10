import { createContext } from 'react'
import zhTW from './dictionaries/zhTW'

export const SUPPORTED_LANGS = [
  { id: 'zhTW', label: '繁體中文' },
  { id: 'en', label: 'English' },
]

export const DEFAULT_LANG = 'zhTW'

export const I18nContext = createContext({
  lang: DEFAULT_LANG,
  t: zhTW,
  setLang: () => {},
  formatDate: () => '—',
})
