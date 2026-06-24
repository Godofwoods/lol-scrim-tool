import type { Scrim } from '../types'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function History({ scrims }: { scrims: Scrim[] }) {
  const wins = scrims.filter(s => s.win).length
  const losses = scrims.length - wins
  const wr = scrims.length > 0 ? Math.round((wins / scrims.length) * 100) : 0

  return (
    <div>
      <div className="stats-summary">
        <div className="stat-card">
          <div className="value">{scrims.length}</div>
          <div className="label">Scrims</div>
        </div>
        <div className="stat-card">
          <div className="value win-color">{wins}W</div>
          <div className="label">Victoires</div>
        </div>
        <div className="stat-card">
          <div className="value loss-color">{losses}L</div>
          <div className="label">Défaites</div>
        </div>
        <div className="stat-card">
          <div className="value">{wr}%</div>
          <div className="label">Winrate</div>
        </div>
      </div>

      <div className="scrim-list">
        {scrims.map(scrim => (
          <div key={scrim.matchId} className={`scrim-card ${scrim.win ? 'win' : 'loss'}`}>
            <div className="scrim-header">
              <span className={`scrim-result ${scrim.win ? 'win' : 'loss'}`}>
                {scrim.win ? 'VICTOIRE' : 'DÉFAITE'}
              </span>
              <span className="scrim-meta">
                {formatDate(scrim.gameCreation)} — {formatDuration(scrim.gameDuration)}
              </span>
            </div>
            <div className="scrim-teams">
              <div className="team-section">
                <h3>Équipe</h3>
                {scrim.ally.map((p, i) => (
                  <div key={i} className="participant-row">
                    <span className="position">{positionLabel(p.teamPosition)}</span>
                    <span className="champion">{p.championName}</span>
                    <span className="name">{p.riotIdGameName}</span>
                    <span className="kda">{p.kills}/{p.deaths}/{p.assists}</span>
                    <span className="cs">{p.totalMinionsKilled + p.neutralMinionsKilled} CS</span>
                  </div>
                ))}
              </div>
              <div className="team-section">
                <h3>Adversaire</h3>
                {scrim.enemy.map((p, i) => (
                  <div key={i} className="participant-row">
                    <span className="position">{positionLabel(p.teamPosition)}</span>
                    <span className="champion">{p.championName}</span>
                    <span className="name">{p.riotIdGameName}</span>
                    <span className="kda">{p.kills}/{p.deaths}/{p.assists}</span>
                    <span className="cs">{p.totalMinionsKilled + p.neutralMinionsKilled} CS</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function positionLabel(pos: string): string {
  const map: Record<string, string> = {
    TOP: 'Top', JUNGLE: 'Jgl', MIDDLE: 'Mid', BOTTOM: 'Bot', UTILITY: 'Sup'
  }
  return map[pos] || pos || '?'
}
