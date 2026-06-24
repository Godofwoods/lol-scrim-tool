export interface RiotAccount {
  puuid: string
  gameName: string
  tagLine: string
}

export interface Participant {
  riotIdGameName: string
  riotIdTagline: string
  puuid: string
  championName: string
  championId: number
  teamPosition: string
  kills: number
  deaths: number
  assists: number
  totalDamageDealtToChampions: number
  totalDamageTaken: number
  totalMinionsKilled: number
  neutralMinionsKilled: number
  visionScore: number
  wardsPlaced: number
  wardsKilled: number
  goldEarned: number
  win: boolean
  teamId: number
  item0: number
  item1: number
  item2: number
  item3: number
  item4: number
  item5: number
  item6: number
  doubleKills: number
  tripleKills: number
  quadraKills: number
  pentaKills: number
  firstBloodKill: boolean
  turretKills: number
  inhibitorKills: number
  totalHealsOnTeammates: number
  damageDealtToObjectives: number
  damageDealtToTurrets: number
}

export interface Scrim {
  matchId: string
  gameCreation: number
  gameDuration: number
  gameVersion: string
  ally: Participant[]
  enemy: Participant[]
  win: boolean
  teams: any[]
}

export interface AppConfig {
  teamTag: string
  minTeamPlayers: number
  region: string
  platform: string
}
