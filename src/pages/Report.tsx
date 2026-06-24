import { useRef, useMemo } from 'react'
import type { Scrim } from '../types'

function avg(val: number, games: number) {
  return games > 0 ? (val / games).toFixed(1) : '0'
}

function kdaStr(k: number, d: number, a: number) {
  return d > 0 ? ((k + a) / d).toFixed(2) : 'Perfect'
}

function positionLabel(pos: string): string {
  const map: Record<string, string> = { TOP: 'Top', JUNGLE: 'Jgl', MIDDLE: 'Mid', BOTTOM: 'Bot', UTILITY: 'Sup' }
  return map[pos] || pos
}

export default function Report({ scrims, accountName }: { scrims: Scrim[]; accountName: string | null }) {
  const reportRef = useRef<HTMLDivElement>(null)

  const wins = scrims.filter(s => s.win).length
  const losses = scrims.length - wins
  const wr = scrims.length > 0 ? Math.round((wins / scrims.length) * 100) : 0
  const avgDuration = scrims.length > 0
    ? Math.round(scrims.reduce((s, sc) => s + sc.gameDuration, 0) / scrims.length / 60)
    : 0

  const playerSummaries = useMemo(() => {
    const map = new Map<string, {
      name: string; games: number; wins: number;
      kills: number; deaths: number; assists: number;
      damage: number; cs: number; vision: number; gold: number;
      positions: Record<string, number>
    }>()

    for (const scrim of scrims) {
      for (const p of scrim.ally) {
        if (!map.has(p.riotIdGameName)) {
          map.set(p.riotIdGameName, {
            name: p.riotIdGameName, games: 0, wins: 0,
            kills: 0, deaths: 0, assists: 0,
            damage: 0, cs: 0, vision: 0, gold: 0,
            positions: {}
          })
        }
        const s = map.get(p.riotIdGameName)!
        s.games++
        if (scrim.win) s.wins++
        s.kills += p.kills
        s.deaths += p.deaths
        s.assists += p.assists
        s.damage += p.totalDamageDealtToChampions
        s.cs += p.totalMinionsKilled + p.neutralMinionsKilled
        s.vision += p.visionScore
        s.gold += p.goldEarned
        if (p.teamPosition) {
          s.positions[p.teamPosition] = (s.positions[p.teamPosition] || 0) + 1
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.games - a.games)
  }, [scrims])

  const handleExportImage = async () => {
    if (!reportRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: '#0a0e14',
      scale: 2
    })
    const link = document.createElement('a')
    link.download = `scrim-report-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const handleExportPDF = async () => {
    if (!reportRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: '#0a0e14',
      scale: 2
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    pdf.save(`scrim-report-${Date.now()}.pdf`)
  }

  return (
    <div>
      <div className="export-bar">
        <button onClick={handleExportImage} className="btn-export">Exporter en image</button>
        <button onClick={handleExportPDF} className="btn-export">Exporter en PDF</button>
      </div>

      <div ref={reportRef} className="report">
        <div className="report-header">
          <h2>Bilan des Scrims</h2>
          {accountName && <p className="report-subtitle">{accountName}</p>}
          <p className="report-date">
            {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="report-overview">
          <div className="report-stat">
            <span className="report-stat-value">{scrims.length}</span>
            <span className="report-stat-label">Scrims joués</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value win-color">{wins}W</span>
            <span className="report-stat-label">Victoires</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value loss-color">{losses}L</span>
            <span className="report-stat-label">Défaites</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value">{wr}%</span>
            <span className="report-stat-label">Winrate</span>
          </div>
          <div className="report-stat">
            <span className="report-stat-value">{avgDuration} min</span>
            <span className="report-stat-label">Durée moy.</span>
          </div>
        </div>

        <h3 className="report-section-title">Performance par joueur</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Rôle</th>
              <th>G</th>
              <th>WR</th>
              <th>KDA</th>
              <th>K/g</th>
              <th>D/g</th>
              <th>A/g</th>
              <th>DMG/g</th>
              <th>CS/g</th>
              <th>Vision/g</th>
            </tr>
          </thead>
          <tbody>
            {playerSummaries.map(p => {
              const mainPos = Object.entries(p.positions).sort((a, b) => b[1] - a[1])[0]
              return (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{mainPos ? positionLabel(mainPos[0]) : '?'}</td>
                  <td>{p.games}</td>
                  <td className={p.wins / p.games >= 0.5 ? 'win-color' : 'loss-color'}>
                    {Math.round((p.wins / p.games) * 100)}%
                  </td>
                  <td>{kdaStr(p.kills, p.deaths, p.assists)}</td>
                  <td>{avg(p.kills, p.games)}</td>
                  <td>{avg(p.deaths, p.games)}</td>
                  <td>{avg(p.assists, p.games)}</td>
                  <td>{(p.damage / p.games / 1000).toFixed(1)}k</td>
                  <td>{avg(p.cs, p.games)}</td>
                  <td>{avg(p.vision, p.games)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
