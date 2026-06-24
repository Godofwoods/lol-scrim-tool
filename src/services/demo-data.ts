import type { Scrim, Participant } from '../types'

const ALLIES = [
  { name: 'FIS Godofwoods', tag: 'AYA' },
  { name: 'FIS SteroiDTV', tag: 'EUW' },
  { name: 'FIS Skilen', tag: 'EUW' },
  { name: 'FIS Crocass', tag: 'EUW' },
  { name: 'FIS Vaalouu', tag: 'EUW' },
]

const ENEMIES_POOL = [
  ['BakerStrit', 'ELO OFFICER', 'HoldUpImCooking', 'turbo indian', 'Akuma'],
  ['DiaboloXKnighty', 'DOUBINIGS', 'Faker Jr', 'LyxArt', 'LBJ23'],
  ['Violêt', 'IToastMyWaffles', 'SuperKnazen', 'Tango', 'K5T Zodiac'],
  ['xKairito', 'Nightblade', 'Th3Cr4zy0ne', 'VoidWalker', 'SkyForge'],
  ['PhantomRush', 'BlizzardX', 'IronCladKing', 'DawnBreaker', 'FrostByte'],
  ['ShadowMerc', 'LunarEclipse', 'DragonSlyr', 'StormRider', 'NovaPulse'],
]

const CHAMPIONS = [
  'Aatrox', 'Ahri', 'Akali', 'Amumu', 'Aphelios', 'Ashe', 'Azir', 'Braum',
  'Caitlyn', 'Camille', 'Diana', 'Draven', 'Ezreal', 'Fiora', 'Gnar', 'Graves',
  'Irelia', 'Jax', 'Jinx', 'Kaisa', 'Kayn', 'Kennen', 'Kindred', 'KogMaw',
  'LeeSin', 'Leona', 'Lissandra', 'Lucian', 'Lulu', 'Lux', 'Maokai', 'MissFortune',
  'Nasus', 'Nautilus', 'Orianna', 'Ornn', 'Pyke', 'Qiyana', 'Rakan', 'Renekton',
  'Riven', 'Sejuani', 'Senna', 'Seraphine', 'Shen', 'Syndra', 'Thresh', 'Tristana',
  'TwistedFate', 'Varus', 'Veigar', 'Viktor', 'Xayah', 'Yasuo', 'Yone', 'Zeri',
]

const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeParticipant(name: string, tag: string, teamId: number, position: string, win: boolean): Participant {
  const kills = rand(1, 18)
  const deaths = rand(1, 14)
  const assists = rand(2, 22)
  return {
    riotIdGameName: name,
    riotIdTagline: tag,
    puuid: '',
    championName: pick(CHAMPIONS),
    championId: rand(1, 170),
    teamPosition: position,
    kills, deaths, assists,
    totalDamageDealtToChampions: rand(8000, 45000),
    totalDamageTaken: rand(10000, 50000),
    totalMinionsKilled: rand(80, 320),
    neutralMinionsKilled: position === 'JUNGLE' ? rand(80, 180) : rand(0, 30),
    visionScore: rand(10, 60),
    wardsPlaced: rand(3, 25),
    wardsKilled: rand(0, 12),
    goldEarned: rand(8000, 18000),
    win,
    teamId,
    item0: rand(1000, 7000), item1: rand(1000, 7000), item2: rand(1000, 7000),
    item3: rand(1000, 7000), item4: rand(1000, 7000), item5: rand(1000, 7000), item6: rand(2000, 3000),
    doubleKills: rand(0, 3), tripleKills: rand(0, 1), quadraKills: 0, pentaKills: 0,
    firstBloodKill: false,
    turretKills: rand(0, 3),
    inhibitorKills: rand(0, 1),
    totalHealsOnTeammates: rand(0, 5000),
    damageDealtToObjectives: rand(2000, 20000),
    damageDealtToTurrets: rand(500, 8000),
  }
}

function generateScrim(index: number): Scrim {
  const win = Math.random() > 0.45
  const enemies = ENEMIES_POOL[index % ENEMIES_POOL.length]
  const daysAgo = index * 3 + rand(0, 2)
  const gameCreation = Date.now() - daysAgo * 86400000 - rand(0, 43200000)

  const ally = ALLIES.map((a, i) =>
    makeParticipant(a.name, a.tag, 100, POSITIONS[i], win)
  )
  const enemy = enemies.map((name, i) =>
    makeParticipant(name, 'EUW', 200, POSITIONS[i], !win)
  )

  return {
    matchId: `EUW1_${7890000000 + index * 100000 + rand(0, 99999)}`,
    gameCreation,
    gameDuration: rand(1500, 2400),
    gameVersion: '16.12.788.4269',
    ally,
    enemy,
    win,
    teams: [],
  }
}

export function generateDemoScrims(count = 24): Scrim[] {
  return Array.from({ length: count }, (_, i) => generateScrim(i))
}
