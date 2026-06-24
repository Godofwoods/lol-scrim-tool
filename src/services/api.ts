import type { RiotAccount, Scrim, AppConfig } from '../types'

const BASE = '/api'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Erreur ${res.status}`)
  }
  return res.json()
}

export function getConfig() {
  return fetchJSON<AppConfig>(`${BASE}/config`)
}

export function getStatus() {
  return fetchJSON<{ lcuConnected: boolean; riotApiConfigured: boolean }>(`${BASE}/status`)
}

export function getAccount(gameName: string, tagLine: string) {
  return fetchJSON<RiotAccount>(`${BASE}/account/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)
}

// Primary: get scrims via LCU (includes custom games)
export function getScrimsLCU(count = 100, year?: number) {
  let url = `${BASE}/scrims?count=${count}`
  if (year) url += `&year=${year}`
  return fetchJSON<{ summoner: { gameName: string; tagLine: string; puuid: string }; scrims: Scrim[] }>(url)
}

// Fallback: get scrims via Riot web API (normal games only)
export function getScrimsWeb(puuid: string, count = 50) {
  return fetchJSON<Scrim[]>(`${BASE}/scrims-web/${puuid}?count=${count}`)
}

export interface Progress {
  phase: 'idle' | 'scanning' | 'fetching' | 'done'
  scanned: number
  customsFound: number
  fetched: number
  toFetch: number
  cached: number
}

export function getProgress() {
  return fetchJSON<Progress>(`${BASE}/progress`)
}
