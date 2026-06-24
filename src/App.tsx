import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import type { Scrim } from './types'
import { getStatus, getScrimsLCU, getAccount, getScrimsWeb, getProgress, type Progress } from './services/api'
import History from './pages/History'
import Stats from './pages/Stats'
import Report from './pages/Report'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function App() {
  const [scrims, setScrims] = useState<Scrim[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lcuConnected, setLcuConnected] = useState(false)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(currentYear)
  const [progress, setProgress] = useState<Progress | null>(null)

  const [riotId, setRiotId] = useState('')
  const [mode, setMode] = useState<'lcu' | 'web'>('lcu')

  useEffect(() => {
    getStatus().then(s => {
      setLcuConnected(s.lcuConnected)
      if (!s.lcuConnected) setMode('web')
    }).catch(() => setLcuConnected(false))
  }, [])

  const handleLCUSearch = useCallback(async () => {
    setLoading(true)
    setError(null)
    setScrims([])
    setAccountName(null)
    setProgress(null)

    const pollInterval = setInterval(async () => {
      try {
        const p = await getProgress()
        setProgress(p)
      } catch { }
    }, 500)

    try {
      const result = await getScrimsLCU(200, selectedYear)
      setAccountName(`${result.summoner.gameName}#${result.summoner.tagLine}`)
      setScrims(result.scrims)
      if (result.scrims.length === 0) {
        setError(`Aucun scrim trouvé${selectedYear ? ` en ${selectedYear}` : ''}. Vérifie que tu as joué des customs avec au moins 3 joueurs "FIS".`)
      }
    } catch (err: any) {
      setError(err.message)
      if (err.message.includes('non détecté')) {
        setLcuConnected(false)
      }
    } finally {
      clearInterval(pollInterval)
      setLoading(false)
      setProgress(null)
    }
  }, [selectedYear])

  const handleWebSearch = useCallback(async () => {
    const parts = riotId.split('#')
    if (parts.length !== 2) {
      setError('Format attendu : GameName#TAG (ex: FISPlayer#EUW)')
      return
    }
    const [gameName, tagLine] = parts
    setLoading(true)
    setError(null)
    setScrims([])

    try {
      const acc = await getAccount(gameName.trim(), tagLine.trim())
      setAccountName(`${acc.gameName}#${acc.tagLine}`)
      const results = await getScrimsWeb(acc.puuid, 50)
      setScrims(results)
      if (results.length === 0) {
        setError('Aucun scrim trouvé via l\'API web (les parties customs ne sont pas visibles via cette méthode).')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [riotId])

  const refreshStatus = async () => {
    const s = await getStatus()
    setLcuConnected(s.lcuConnected)
    if (s.lcuConnected) setMode('lcu')
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">LoL Scrim Tool</h1>
        {accountName && <span className="account-tag">{accountName}</span>}
      </header>

      <div className="mode-bar">
        <button
          className={`mode-btn ${mode === 'lcu' ? 'active' : ''}`}
          onClick={() => { setMode('lcu'); refreshStatus() }}
        >
          Client LoL (customs)
        </button>
        <button
          className={`mode-btn ${mode === 'web' ? 'active' : ''}`}
          onClick={() => setMode('web')}
        >
          API Web (fallback)
        </button>
        <span className={`status-dot ${lcuConnected ? 'connected' : ''}`} />
        <span className="status-text">
          {lcuConnected ? 'Client LoL connecté' : 'Client LoL non détecté'}
        </span>
      </div>

      {mode === 'lcu' && (
        <div className="search-bar">
          <span className="search-info">
            Récupère l'historique depuis ton client LoL (customs incluses)
          </span>
          <select
            className="year-select"
            value={selectedYear ?? ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="">Toutes les années</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handleLCUSearch} disabled={loading}>
            {loading ? 'Analyse...' : 'Analyser mes scrims'}
          </button>
        </div>
      )}

      {mode === 'web' && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Riot ID (ex: FISPlayer#EUW)"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleWebSearch()}
          />
          <button onClick={handleWebSearch} disabled={loading || !riotId.trim()}>
            {loading ? 'Recherche...' : 'Chercher'}
          </button>
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {loading && (
        <div className="progress-container">
          {progress && progress.phase === 'scanning' && (
            <>
              <div className="progress-text">
                Scan de l'historique... {progress.scanned} parties analysées, {progress.customsFound} customs trouvées
              </div>
              <div className="progress-bar"><div className="progress-bar-fill indeterminate" /></div>
            </>
          )}
          {progress && progress.phase === 'fetching' && progress.toFetch > 0 && (
            <>
              <div className="progress-text">
                Récupération des détails... {progress.fetched}/{progress.toFetch} parties
                {progress.cached > 0 && ` (${progress.cached} en cache)`}
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${Math.round((progress.fetched / progress.toFetch) * 100)}%` }} />
              </div>
            </>
          )}
          {(!progress || progress.phase === 'idle') && (
            <div className="progress-text">Connexion au client LoL...</div>
          )}
        </div>
      )}

      {scrims.length > 0 && (
        <>
          <div className="results-info">
            <span>{scrims.length} scrims trouvés{selectedYear ? ` en ${selectedYear}` : ''}</span>
            <span className="hint">Ouvre ton historique dans le client LoL et scroll pour trouver plus de scrims anciens</span>
          </div>
          <nav className="nav">
            <NavLink to="/" end>Historique</NavLink>
            <NavLink to="/stats">Statistiques</NavLink>
            <NavLink to="/report">Bilan</NavLink>
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
          {mode === 'lcu' ? (
            <>
              <p>Assure-toi que ton client League of Legends est lancé.</p>
              <p className="hint">
                Clique sur "Analyser mes scrims" pour scanner ton historique (customs incluses).
              </p>
              <div className="tip">
                <strong>Astuce :</strong> Pour trouver plus de scrims anciens, ouvre ton <strong>Profil &gt; Historique</strong> dans le client LoL et <strong>scroll vers le bas</strong> pour charger plus de parties, puis relance l'analyse. Les scrims trouvés sont sauvegardés en cache local.
              </div>
            </>
          ) : (
            <>
              <p>Entre un Riot ID pour rechercher les scrims récents.</p>
              <p className="hint">
                Note : l'API web ne peut pas voir les parties customs. Utilise le mode "Client LoL" si possible.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
