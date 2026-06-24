import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import type { Scrim } from './types'
import { getStatus, getScrimsLCU, getAccount, getScrimsWeb, getProgress, type Progress } from './services/api'
import { generateDemoScrims } from './services/demo-data'
import { useLang, LangSwitch } from './services/LangContext'
import History from './pages/History'
import Stats from './pages/Stats'
import Report from './pages/Report'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function App() {
  const { t } = useLang()
  const [scrims, setScrims] = useState<Scrim[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lcuConnected, setLcuConnected] = useState(false)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(currentYear)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  const [riotId, setRiotId] = useState('')
  const [mode, setMode] = useState<'lcu' | 'web'>('lcu')

  useEffect(() => {
    getStatus().then(s => {
      setLcuConnected(s.lcuConnected)
      if (!s.lcuConnected) setMode('web')
    }).catch(() => setLcuConnected(false))
  }, [])

  const handleDemo = () => {
    setScrims(generateDemoScrims(24))
    setAccountName('FIS Godofwoods#AYA')
    setIsDemo(true)
    setError(null)
  }

  const handleLCUSearch = useCallback(async () => {
    setLoading(true)
    setError(null)
    setScrims([])
    setAccountName(null)
    setIsDemo(false)
    setProgress(null)

    const pollInterval = setInterval(async () => {
      try { setProgress(await getProgress()) } catch { }
    }, 500)

    try {
      const result = await getScrimsLCU(200, selectedYear)
      setAccountName(`${result.summoner.gameName}#${result.summoner.tagLine}`)
      setScrims(result.scrims)
      if (result.scrims.length === 0) {
        setError(selectedYear
          ? t('error.noScrimYear', { year: selectedYear })
          : t('error.noScrimGeneric'))
      }
    } catch (err: any) {
      setError(err.message)
      if (err.message.includes('non détecté') || err.message.includes('not detected')) {
        setLcuConnected(false)
      }
    } finally {
      clearInterval(pollInterval)
      setLoading(false)
      setProgress(null)
    }
  }, [selectedYear, t])

  const handleWebSearch = useCallback(async () => {
    const parts = riotId.split('#')
    if (parts.length !== 2) {
      setError(t('error.format'))
      return
    }
    const [gameName, tagLine] = parts
    setLoading(true)
    setError(null)
    setScrims([])
    setIsDemo(false)

    try {
      const acc = await getAccount(gameName.trim(), tagLine.trim())
      setAccountName(`${acc.gameName}#${acc.tagLine}`)
      const results = await getScrimsWeb(acc.puuid, 50)
      setScrims(results)
      if (results.length === 0) setError(t('error.webNoCustoms'))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [riotId, t])

  const refreshStatus = async () => {
    const s = await getStatus()
    setLcuConnected(s.lcuConnected)
    if (s.lcuConnected) setMode('lcu')
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">LoL Scrim Tool</h1>
        <div className="header-right">
          <LangSwitch />
          {isDemo && <span className="demo-badge">{t('demo')}</span>}
          {accountName && <span className="account-tag">{accountName}</span>}
        </div>
      </header>

      <div className="mode-bar">
        <button className={`mode-btn ${mode === 'lcu' ? 'active' : ''}`} onClick={() => { setMode('lcu'); refreshStatus() }}>
          {t('mode.lcu')}
        </button>
        <button className={`mode-btn ${mode === 'web' ? 'active' : ''}`} onClick={() => setMode('web')}>
          {t('mode.web')}
        </button>
        <span className={`status-dot ${lcuConnected ? 'connected' : ''}`} />
        <span className="status-text">{lcuConnected ? t('status.connected') : t('status.disconnected')}</span>
      </div>

      {mode === 'lcu' && (
        <div className="search-bar">
          <span className="search-info">{t('search.info')}</span>
          <select className="year-select" value={selectedYear ?? ''} onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}>
            <option value="">{t('search.allYears')}</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleLCUSearch} disabled={loading}>
            {loading ? t('search.analyzing') : t('search.analyze')}
          </button>
        </div>
      )}

      {mode === 'web' && (
        <div className="search-bar">
          <input type="text" placeholder={t('search.riotId.placeholder')} value={riotId} onChange={(e) => setRiotId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !loading && handleWebSearch()} />
          <button onClick={handleWebSearch} disabled={loading || !riotId.trim()}>
            {loading ? t('search.searching') : t('search.search')}
          </button>
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {loading && (
        <div className="progress-container">
          {progress && progress.phase === 'scanning' && (
            <>
              <div className="progress-text">{t('progress.scanning', { scanned: progress.scanned, customs: progress.customsFound })}</div>
              <div className="progress-bar"><div className="progress-bar-fill indeterminate" /></div>
            </>
          )}
          {progress && progress.phase === 'fetching' && progress.toFetch > 0 && (
            <>
              <div className="progress-text">
                {t('progress.fetching', { fetched: progress.fetched, total: progress.toFetch })}
                {progress.cached > 0 && ` (${t('progress.cached', { n: progress.cached })})`}
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${Math.round((progress.fetched / progress.toFetch) * 100)}%` }} />
              </div>
            </>
          )}
          {(!progress || progress.phase === 'idle') && (
            <div className="progress-text">{t('progress.connecting')}</div>
          )}
        </div>
      )}

      {scrims.length > 0 && (
        <>
          <div className="results-info">
            <span>{isDemo || !selectedYear ? t('results.found', { n: scrims.length }) : t('results.foundYear', { n: scrims.length, year: selectedYear })}</span>
            {!isDemo && <span className="hint">{t('results.hint')}</span>}
          </div>
          <nav className="nav">
            <NavLink to="/" end>{t('nav.history')}</NavLink>
            <NavLink to="/stats">{t('nav.stats')}</NavLink>
            <NavLink to="/report">{t('nav.report')}</NavLink>
          </nav>
          <Routes>
            <Route path="/" element={<History scrims={scrims} />} />
            <Route path="/stats" element={<Stats scrims={scrims} />} />
            <Route path="/report" element={<Report scrims={scrims} accountName={accountName} />} />
          </Routes>
        </>
      )}

      {!loading && scrims.length === 0 && !error && (
        <div className="empty">
          <div className="hero">
            <h2>{t('hero.title')}</h2>
            <p>{t('hero.desc')}</p>
            <p className="hint">{t('hero.hint')}</p>
            <button className="btn-demo" onClick={handleDemo}>{t('hero.demo')}</button>
          </div>
          {mode === 'lcu' && (
            <div className="tip">
              <strong>{t('tip.label')}</strong>{' '}
              <span dangerouslySetInnerHTML={{ __html: t('tip.lcu') }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
