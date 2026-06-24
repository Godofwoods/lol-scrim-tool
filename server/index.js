import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { getLCUCredentials, createLCUFetcher } from './lcu.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const app = express()

// Serve frontend static files FIRST (correct MIME types)
const distPath = path.join(__dirname, '../dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
}

app.use(cors())
app.use(express.json())

const API_KEY = process.env.RIOT_API_KEY || ''
const REGION = process.env.RIOT_REGION || 'europe'
const PLATFORM = process.env.RIOT_PLATFORM || 'euw1'
const TEAM_TAG = process.env.TEAM_TAG || 'FIS'
const MIN_TEAM_PLAYERS = parseInt(process.env.MIN_TEAM_PLAYERS || '3', 10)

// --- Local scrim cache ---
const CACHE_FILE = './data/scrims-cache.json'

function loadCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
    }
  } catch { }
  return {}
}

function saveCache(cache) {
  if (!existsSync('./data')) mkdirSync('./data', { recursive: true })
  writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8')
}

// key: gameId -> scrim data
let scrimCache = loadCache()
console.log(`[cache] ${Object.keys(scrimCache).length} scrims loaded from cache`)

// Champion ID -> Name mapping from Data Dragon
let championById = {}
async function loadChampions() {
  try {
    const versions = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(r => r.json())
    const latest = versions[0]
    const data = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`).then(r => r.json())
    for (const champ of Object.values(data.data)) {
      championById[parseInt(champ.key)] = champ.id
    }
    console.log(`[ddragon] Loaded ${Object.keys(championById).length} champions (patch ${latest})`)
  } catch (e) {
    console.log('[ddragon] Failed to load champions:', e.message)
  }
}
loadChampions()

// --- Progress tracking ---
let progress = { phase: 'idle', scanned: 0, customsFound: 0, fetched: 0, toFetch: 0, cached: 0 }

app.get('/api/progress', (req, res) => {
  res.json(progress)
})

async function riotFetch(url) {
  const res = await fetch(url, { headers: { 'X-Riot-Token': API_KEY } })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Riot API ${res.status}: ${text}`)
  }
  return res.json()
}

let lcuFetch = null
let lcuConnected = false

function tryConnectLCU() {
  try {
    const creds = getLCUCredentials()
    if (creds) {
      lcuFetch = createLCUFetcher(creds)
      lcuConnected = true
      console.log(`[LCU] Connected (port ${creds.port})`)
      return true
    }
  } catch (e) {
    console.log('[LCU] Error:', e.message)
  }
  lcuConnected = false
  lcuFetch = null
  return false
}

app.get('/api/status', (req, res) => {
  tryConnectLCU()
  res.json({ lcuConnected, riotApiConfigured: !!API_KEY && !API_KEY.startsWith('RGAPI-xxxx') })
})

app.get('/api/config', (req, res) => {
  res.json({ teamTag: TEAM_TAG, minTeamPlayers: MIN_TEAM_PLAYERS, region: REGION, platform: PLATFORM })
})

app.get('/api/account/:gameName/:tagLine', async (req, res) => {
  try {
    const { gameName, tagLine } = req.params
    const data = await riotFetch(
      `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    )
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

function mapLCUParticipant(p, identity) {
  return {
    riotIdGameName: identity.gameName || identity.summonerName || '?',
    riotIdTagline: identity.tagLine || '',
    puuid: identity.puuid || '',
    championName: championById[p.championId] || String(p.championId),
    teamPosition: p.timeline?.lane || '',
    teamId: p.teamId,
    kills: p.stats?.kills || 0,
    deaths: p.stats?.deaths || 0,
    assists: p.stats?.assists || 0,
    totalDamageDealtToChampions: p.stats?.totalDamageDealtToChampions || 0,
    totalDamageTaken: p.stats?.totalDamageTaken || 0,
    totalMinionsKilled: p.stats?.totalMinionsKilled || 0,
    neutralMinionsKilled: p.stats?.neutralMinionsKilled || 0,
    visionScore: p.stats?.visionScore || 0,
    wardsPlaced: p.stats?.wardsPlaced || 0,
    wardsKilled: p.stats?.wardsKilled || 0,
    goldEarned: p.stats?.goldEarned || 0,
    win: p.stats?.win || false,
    item0: p.stats?.item0 || 0, item1: p.stats?.item1 || 0,
    item2: p.stats?.item2 || 0, item3: p.stats?.item3 || 0,
    item4: p.stats?.item4 || 0, item5: p.stats?.item5 || 0,
    item6: p.stats?.item6 || 0,
    doubleKills: p.stats?.doubleKills || 0,
    tripleKills: p.stats?.tripleKills || 0,
    quadraKills: p.stats?.quadraKills || 0,
    pentaKills: p.stats?.pentaKills || 0,
    firstBloodKill: p.stats?.firstBloodKill || false,
    turretKills: p.stats?.turretKills || 0,
    inhibitorKills: p.stats?.inhibitorKills || 0,
    totalHealsOnTeammates: p.stats?.totalHeal || 0,
    damageDealtToObjectives: p.stats?.damageDealtToObjectives || 0,
    damageDealtToTurrets: p.stats?.damageDealtToTurrets || 0
  }
}

app.get('/api/scrims', async (req, res) => {
  // Always refresh LCU credentials (token can rotate)
  tryConnectLCU()
  if (!lcuConnected) {
    return res.status(503).json({ error: 'Client LoL non detecte. Lance le client League of Legends et reessaie.' })
  }

  try {
    const summoner = await lcuFetch('/lol-summoner/v1/current-summoner')
    const puuid = summoner.puuid
    const year = req.query.year ? parseInt(req.query.year) : null

    progress = { phase: 'scanning', scanned: 0, customsFound: 0, fetched: 0, toFetch: 0, cached: 0 }

    const seenGameIds = new Set()
    const customGameIds = []

    // Single fetch — LCU ignores pagination and returns its full cache
    const matchHistory = await lcuFetch(
      `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=0&endIndex=100`
    )
    const games = matchHistory.games?.games || matchHistory.games || []

    for (const g of games) {
      if (seenGameIds.has(g.gameId)) continue
      seenGameIds.add(g.gameId)

      if (year) {
        const gameYear = new Date(g.gameCreation).getFullYear()
        if (gameYear !== year) continue
      }

      if (g.gameType === 'CUSTOM_GAME' && g.gameMode === 'CLASSIC') {
        customGameIds.push(g.gameId)
      }
    }

    progress = { ...progress, scanned: games.length, customsFound: customGameIds.length }
    console.log(`[scrims] ${customGameIds.length} custom games found (scanned ${games.length} from LCU cache)`)

    // Step 3: fetch full details for new custom games, use cache for already known ones
    const newGameIds = customGameIds.filter(id => !scrimCache[id])
    const cachedCount = customGameIds.length - newGameIds.length
    console.log(`[scrims] ${customGameIds.length} customs found, ${newGameIds.length} new to fetch, ${cachedCount} from cache`)
    progress = { phase: 'fetching', scanned: games.length, customsFound: customGameIds.length, fetched: 0, toFetch: newGameIds.length, cached: cachedCount }

    for (const gameId of newGameIds) {
      try {
        const game = await lcuFetch(`/lol-match-history/v1/games/${gameId}`)
        const participants = game.participants || []
        const identities = game.participantIdentities || []

        const players = participants.map((p, i) => {
          const identity = identities[i]?.player || {}
          return mapLCUParticipant(p, identity)
        })

        const team1 = players.filter(p => p.teamId === 100)
        const team2 = players.filter(p => p.teamId === 200)
        const team1Tag = team1.filter(p => p.riotIdGameName?.toUpperCase().startsWith(TEAM_TAG.toUpperCase())).length
        const team2Tag = team2.filter(p => p.riotIdGameName?.toUpperCase().startsWith(TEAM_TAG.toUpperCase())).length
        const isScrim = (team1Tag >= MIN_TEAM_PLAYERS && team2Tag < MIN_TEAM_PLAYERS) || (team2Tag >= MIN_TEAM_PLAYERS && team1Tag < MIN_TEAM_PLAYERS)

        // Cache the result (scrim or not, to avoid re-fetching)
        if (isScrim) {
          const allyTeamId = team1Tag >= MIN_TEAM_PLAYERS ? 100 : 200
          scrimCache[gameId] = {
            matchId: `${PLATFORM.toUpperCase()}_${gameId}`,
            gameId,
            gameCreation: game.gameCreation,
            gameDuration: game.gameDuration,
            gameVersion: game.gameVersion || '',
            gameType: game.gameType || '',
            queueId: game.queueId,
            ally: players.filter(p => p.teamId === allyTeamId),
            enemy: players.filter(p => p.teamId !== allyTeamId),
            win: players.find(p => p.teamId === allyTeamId)?.win ?? false,
            teams: game.teams || []
          }
        } else {
          scrimCache[gameId] = { notScrim: true }
        }
      } catch (e) {
        console.log(`[scrims] Skip game ${gameId}: ${e.message}`)
      }
      progress = { ...progress, fetched: progress.fetched + 1 }
    }

    // Save cache if we fetched new games
    if (newGameIds.length > 0) {
      saveCache(scrimCache)
      const scrimCount = Object.values(scrimCache).filter(v => !v.notScrim).length
      console.log(`[cache] Saved ${scrimCount} scrims to cache`)
    }

    // Build response from cache + year filter
    const allCachedScrims = Object.values(scrimCache).filter(v => !v.notScrim)
    const scrims = year
      ? allCachedScrims.filter(s => new Date(s.gameCreation).getFullYear() === year)
      : allCachedScrims
    scrims.sort((a, b) => b.gameCreation - a.gameCreation)

    progress = { phase: 'done', scanned: games.length, customsFound: customGameIds.length, fetched: newGameIds.length, toFetch: 0, cached: cachedCount }
    console.log(`[scrims] Returning ${scrims.length} scrims${year ? ` for ${year}` : ''}`)

    res.json({
      summoner: { gameName: summoner.gameName || summoner.displayName, tagLine: summoner.tagLine || '', puuid: summoner.puuid },
      scrims
    })
  } catch (e) {
    lcuConnected = false
    res.status(500).json({ error: `Erreur LCU: ${e.message}` })
  }
})

app.get('/api/scrims-web/:puuid', async (req, res) => {
  try {
    const { puuid } = req.params
    const count = req.query.count || 50
    const matchIds = await riotFetch(`https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`)
    const scrims = []

    for (const matchId of matchIds) {
      try {
        const match = await riotFetch(`https://${REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`)
        if (!match?.info || match.info.gameMode !== 'CLASSIC') continue
        const team1 = match.info.participants.filter(p => p.teamId === 100)
        const team2 = match.info.participants.filter(p => p.teamId === 200)
        const team1Tag = team1.filter(p => p.riotIdGameName?.toUpperCase().startsWith(TEAM_TAG.toUpperCase())).length
        const team2Tag = team2.filter(p => p.riotIdGameName?.toUpperCase().startsWith(TEAM_TAG.toUpperCase())).length
        const isScrim = (team1Tag >= MIN_TEAM_PLAYERS && team2Tag < MIN_TEAM_PLAYERS) || (team2Tag >= MIN_TEAM_PLAYERS && team1Tag < MIN_TEAM_PLAYERS)
        if (isScrim) {
          const allyTeamId = team1Tag >= MIN_TEAM_PLAYERS ? 100 : 200
          scrims.push({
            matchId,
            gameCreation: match.info.gameCreation,
            gameDuration: match.info.gameDuration,
            gameVersion: match.info.gameVersion,
            ally: match.info.participants.filter(p => p.teamId === allyTeamId),
            enemy: match.info.participants.filter(p => p.teamId !== allyTeamId),
            win: match.info.participants.find(p => p.teamId === allyTeamId)?.win ?? false,
            teams: match.info.teams
          })
        }
      } catch { continue }
    }
    res.json(scrims)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// SPA fallback: serve index.html for non-API routes
if (existsSync(distPath)) {
  app.get('{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'))
    }
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  tryConnectLCU()
  console.log(`[server] http://localhost:${PORT}`)
  console.log(`[LCU] ${lcuConnected ? 'Connecte' : 'Non detecte'}`)
  setInterval(() => { if (!lcuConnected) tryConnectLCU() }, 15000)
})
