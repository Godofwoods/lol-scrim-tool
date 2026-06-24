import { useMemo } from 'react'
import type { Scrim, Participant } from '../types'
import { championIconUrl } from '../services/ddragon'

interface PlayerStats {
  name: string
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
  cs: number
  vision: number
  damage: number
  gold: number
  damageTaken: number
  kp: number
  champions: Record<string, number>
  positions: Record<string, number>
}

function computePlayerStats(scrims: Scrim[]): PlayerStats[] {
  const map = new Map<string, PlayerStats>()

  for (const scrim of scrims) {
    const totalAllyKills = scrim.ally.reduce((s, p) => s + p.kills, 0)

    for (const p of scrim.ally) {
      const key = p.riotIdGameName
      if (!map.has(key)) {
        map.set(key, {
          name: key, games: 0, wins: 0,
          kills: 0, deaths: 0, assists: 0,
          cs: 0, vision: 0, damage: 0, gold: 0, damageTaken: 0, kp: 0,
          champions: {}, positions: {}
        })
      }
      const s = map.get(key)!
      s.games++
      if (scrim.win) s.wins++
      s.kills += p.kills
      s.deaths += p.deaths
      s.assists += p.assists
      s.cs += p.totalMinionsKilled + p.neutralMinionsKilled
      s.vision += p.visionScore
      s.damage += p.totalDamageDealtToChampions
      s.gold += p.goldEarned
      s.damageTaken += p.totalDamageTaken
      s.kp += totalAllyKills > 0 ? (p.kills + p.assists) / totalAllyKills : 0
      s.champions[p.championName] = (s.champions[p.championName] || 0) + 1
      if (p.teamPosition) {
        s.positions[p.teamPosition] = (s.positions[p.teamPosition] || 0) + 1
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.games - a.games)
}

function computeChampionStats(scrims: Scrim[]) {
  const map = new Map<string, { name: string; games: number; wins: number; kills: number; deaths: number; assists: number }>()

  for (const scrim of scrims) {
    for (const p of scrim.ally) {
      if (!map.has(p.championName)) {
        map.set(p.championName, { name: p.championName, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 })
      }
      const c = map.get(p.championName)!
      c.games++
      if (scrim.win) c.wins++
      c.kills += p.kills
      c.deaths += p.deaths
      c.assists += p.assists
    }
  }

  return Array.from(map.values()).sort((a, b) => b.games - a.games)
}

function avg(val: number, games: number) {
  return games > 0 ? (val / games).toFixed(1) : '0'
}

function kdaStr(k: number, d: number, a: number) {
  return d > 0 ? ((k + a) / d).toFixed(2) : 'Perfect'
}

function TopChampions({ champs, n = 3 }: { champs: Record<string, number>; n?: number }) {
  const top = Object.entries(champs).sort((a, b) => b[1] - a[1]).slice(0, n)
  return (
    <div className="top-champs">
      {top.map(([name, count]) => (
        <span key={name} className="top-champ" title={`${name} (${count})`}>
          <img className="champ-icon-sm" src={championIconUrl(name)} alt={name} />
          {count}
        </span>
      ))}
    </div>
  )
}

function positionLabel(pos: string): string {
  const map: Record<string, string> = { TOP: 'Top', JUNGLE: 'Jgl', MIDDLE: 'Mid', BOTTOM: 'Bot', UTILITY: 'Sup' }
  return map[pos] || pos
}

function mainPosition(positions: Record<string, number>): string {
  const top = Object.entries(positions).sort((a, b) => b[1] - a[1])[0]
  return top ? positionLabel(top[0]) : '?'
}

export default function Stats({ scrims }: { scrims: Scrim[] }) {
  const players = useMemo(() => computePlayerStats(scrims), [scrims])
  const champions = useMemo(() => computeChampionStats(scrims), [scrims])

  const avgGameDuration = scrims.length > 0
    ? Math.round(scrims.reduce((s, sc) => s + sc.gameDuration, 0) / scrims.length / 60)
    : 0

  const totalAllyKills = scrims.reduce((s, sc) => s + sc.ally.reduce((sk, p) => sk + p.kills, 0), 0)
  const totalEnemyKills = scrims.reduce((s, sc) => s + sc.enemy.reduce((sk, p) => sk + p.kills, 0), 0)

  return (
    <div>
      <h2 className="section-title">Vue d'ensemble</h2>
      <div className="stats-summary">
        <div className="stat-card">
          <div className="value">{avgGameDuration} min</div>
          <div className="label">Durée moy.</div>
        </div>
        <div className="stat-card">
          <div className="value win-color">{totalAllyKills}</div>
          <div className="label">Kills équipe</div>
        </div>
        <div className="stat-card">
          <div className="value loss-color">{totalEnemyKills}</div>
          <div className="label">Kills adverses</div>
        </div>
        <div className="stat-card">
          <div className="value">
            {totalEnemyKills > 0 ? (totalAllyKills / totalEnemyKills).toFixed(2) : '∞'}
          </div>
          <div className="label">Ratio K/D global</div>
        </div>
      </div>

      <h2 className="section-title">Statistiques par joueur</h2>
      <div className="table-wrapper">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Rôle</th>
              <th>Parties</th>
              <th>WR</th>
              <th>KDA</th>
              <th>K</th>
              <th>D</th>
              <th>A</th>
              <th>CS/g</th>
              <th>Vision/g</th>
              <th>DMG/g</th>
              <th>Gold/g</th>
              <th>KP%</th>
              <th>Champions</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.name}>
                <td className="player-name">{p.name}</td>
                <td>{mainPosition(p.positions)}</td>
                <td>{p.games}</td>
                <td className={p.wins / p.games >= 0.5 ? 'win-color' : 'loss-color'}>
                  {Math.round((p.wins / p.games) * 100)}%
                </td>
                <td>{kdaStr(p.kills, p.deaths, p.assists)}</td>
                <td>{avg(p.kills, p.games)}</td>
                <td>{avg(p.deaths, p.games)}</td>
                <td>{avg(p.assists, p.games)}</td>
                <td>{avg(p.cs, p.games)}</td>
                <td>{avg(p.vision, p.games)}</td>
                <td>{(p.damage / p.games / 1000).toFixed(1)}k</td>
                <td>{(p.gold / p.games / 1000).toFixed(1)}k</td>
                <td>{Math.round((p.kp / p.games) * 100)}%</td>
                <td><TopChampions champs={p.champions} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Statistiques par champion</h2>
      <div className="table-wrapper">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Champion</th>
              <th>Parties</th>
              <th>WR</th>
              <th>KDA</th>
              <th>K moy</th>
              <th>D moy</th>
              <th>A moy</th>
            </tr>
          </thead>
          <tbody>
            {champions.map(c => (
              <tr key={c.name}>
                <td className="champ-cell">
                  <img className="champ-icon" src={championIconUrl(c.name)} alt={c.name} />
                  {c.name}
                </td>
                <td>{c.games}</td>
                <td className={c.wins / c.games >= 0.5 ? 'win-color' : 'loss-color'}>
                  {Math.round((c.wins / c.games) * 100)}%
                </td>
                <td>{kdaStr(c.kills, c.deaths, c.assists)}</td>
                <td>{avg(c.kills, c.games)}</td>
                <td>{avg(c.deaths, c.games)}</td>
                <td>{avg(c.assists, c.games)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
