import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Lang } from './i18n'
import { t as translate } from './i18n'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextType>(null!)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang')
    return (saved === 'fr' || saved === 'en') ? saved : 'en'
  })

  const changeLang = (l: Lang) => {
    setLang(l)
    localStorage.setItem('lang', l)
  }

  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) =>
    translate(key, lang, vars)

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

export function LangSwitch() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-switch">
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
      <button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
    </div>
  )
}
