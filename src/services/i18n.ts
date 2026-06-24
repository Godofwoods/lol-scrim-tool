export type Lang = 'fr' | 'en'

const translations = {
  // Header
  'demo': { fr: 'DÉMO', en: 'DEMO' },

  // Mode bar
  'mode.lcu': { fr: 'Client LoL (customs)', en: 'LoL Client (customs)' },
  'mode.web': { fr: 'API Web (fallback)', en: 'Web API (fallback)' },
  'status.connected': { fr: 'Client LoL connecté', en: 'LoL Client connected' },
  'status.disconnected': { fr: 'Client LoL non détecté', en: 'LoL Client not detected' },

  // Search bar
  'search.info': { fr: 'Récupère l\'historique depuis ton client LoL (customs incluses)', en: 'Fetches match history from your LoL client (customs included)' },
  'search.allYears': { fr: 'Toutes les années', en: 'All years' },
  'search.analyze': { fr: 'Analyser mes scrims', en: 'Analyze my scrims' },
  'search.analyzing': { fr: 'Analyse...', en: 'Analyzing...' },
  'search.riotId.placeholder': { fr: 'Riot ID (ex: FISPlayer#EUW)', en: 'Riot ID (e.g. FISPlayer#EUW)' },
  'search.search': { fr: 'Chercher', en: 'Search' },
  'search.searching': { fr: 'Recherche...', en: 'Searching...' },

  // Errors
  'error.format': { fr: 'Format attendu : GameName#TAG (ex: FISPlayer#EUW)', en: 'Expected format: GameName#TAG (e.g. FISPlayer#EUW)' },
  'error.noScrim': { fr: 'Aucun scrim trouvé', en: 'No scrims found' },
  'error.noScrimYear': { fr: 'Aucun scrim trouvé en {year}. Vérifie que tu as joué des customs avec au moins 3 joueurs "FIS".', en: 'No scrims found in {year}. Make sure you played customs with at least 3 "FIS" players.' },
  'error.noScrimGeneric': { fr: 'Aucun scrim trouvé. Vérifie que tu as joué des customs avec au moins 3 joueurs "FIS".', en: 'No scrims found. Make sure you played customs with at least 3 "FIS" players.' },
  'error.webNoCustoms': { fr: 'Aucun scrim trouvé via l\'API web (les parties customs ne sont pas visibles via cette méthode).', en: 'No scrims found via web API (custom games are not visible through this method).' },

  // Progress
  'progress.scanning': { fr: 'Scan de l\'historique... {scanned} parties analysées, {customs} customs trouvées', en: 'Scanning history... {scanned} games analyzed, {customs} customs found' },
  'progress.fetching': { fr: 'Récupération des détails... {fetched}/{total} parties', en: 'Fetching details... {fetched}/{total} games' },
  'progress.cached': { fr: '{n} en cache', en: '{n} cached' },
  'progress.connecting': { fr: 'Connexion au client LoL...', en: 'Connecting to LoL client...' },

  // Results
  'results.found': { fr: '{n} scrims trouvés', en: '{n} scrims found' },
  'results.foundYear': { fr: '{n} scrims trouvés en {year}', en: '{n} scrims found in {year}' },
  'results.hint': { fr: 'Ouvre ton historique dans le client LoL et scroll pour trouver plus de scrims anciens', en: 'Open your match history in the LoL client and scroll down to find older scrims' },

  // Nav
  'nav.history': { fr: 'Historique', en: 'History' },
  'nav.stats': { fr: 'Statistiques', en: 'Statistics' },
  'nav.report': { fr: 'Bilan', en: 'Report' },

  // Hero
  'hero.title': { fr: 'Analyse tes scrims League of Legends', en: 'Analyze your League of Legends scrims' },
  'hero.desc': { fr: 'Connecte-toi avec ton client LoL ou ton Riot ID pour visualiser tes statistiques de scrims.', en: 'Connect with your LoL client or Riot ID to view your scrim statistics.' },
  'hero.hint': { fr: 'Un scrim est détecté quand au moins 3 joueurs d\'une équipe ont un pseudo commençant par "FIS".', en: 'A scrim is detected when at least 3 players on a team have a name starting with "FIS".' },
  'hero.demo': { fr: 'Voir la démo', en: 'View demo' },
  'tip.lcu': { fr: 'Pour trouver plus de scrims anciens, ouvre ton <strong>Profil &gt; Historique</strong> dans le client LoL et <strong>scroll vers le bas</strong> pour charger plus de parties, puis relance l\'analyse.', en: 'To find older scrims, open your <strong>Profile &gt; Match History</strong> in the LoL client and <strong>scroll down</strong> to load more games, then re-run the analysis.' },
  'tip.label': { fr: 'Astuce :', en: 'Tip:' },

  // History page
  'history.scrims': { fr: 'Scrims', en: 'Scrims' },
  'history.wins': { fr: 'Victoires', en: 'Wins' },
  'history.losses': { fr: 'Défaites', en: 'Losses' },
  'history.winrate': { fr: 'Winrate', en: 'Winrate' },
  'history.win': { fr: 'VICTOIRE', en: 'WIN' },
  'history.loss': { fr: 'DÉFAITE', en: 'LOSS' },
  'history.team': { fr: 'Équipe', en: 'Team' },
  'history.enemy': { fr: 'Adversaire', en: 'Opponent' },

  // Stats page
  'stats.overview': { fr: 'Vue d\'ensemble', en: 'Overview' },
  'stats.avgDuration': { fr: 'Durée moy.', en: 'Avg. duration' },
  'stats.teamKills': { fr: 'Kills équipe', en: 'Team kills' },
  'stats.enemyKills': { fr: 'Kills adverses', en: 'Enemy kills' },
  'stats.globalKD': { fr: 'Ratio K/D global', en: 'Global K/D ratio' },
  'stats.byPlayer': { fr: 'Statistiques par joueur', en: 'Player statistics' },
  'stats.byChampion': { fr: 'Statistiques par champion', en: 'Champion statistics' },
  'stats.player': { fr: 'Joueur', en: 'Player' },
  'stats.role': { fr: 'Rôle', en: 'Role' },
  'stats.games': { fr: 'Parties', en: 'Games' },
  'stats.champions': { fr: 'Champions', en: 'Champions' },
  'stats.champion': { fr: 'Champion', en: 'Champion' },

  // Report page
  'report.title': { fr: 'Bilan des Scrims', en: 'Scrim Report' },
  'report.exportImg': { fr: 'Exporter en image', en: 'Export as image' },
  'report.exportPdf': { fr: 'Exporter en PDF', en: 'Export as PDF' },
  'report.played': { fr: 'Scrims joués', en: 'Scrims played' },
  'report.wins': { fr: 'Victoires', en: 'Wins' },
  'report.losses': { fr: 'Défaites', en: 'Losses' },
  'report.avgDuration': { fr: 'Durée moy.', en: 'Avg. duration' },
  'report.playerPerf': { fr: 'Performance par joueur', en: 'Player performance' },
} as const

type Key = keyof typeof translations

export function t(key: Key, lang: Lang, vars?: Record<string, string | number>): string {
  let str = translations[key]?.[lang] || translations[key]?.['en'] || key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v))
    }
  }
  return str
}
