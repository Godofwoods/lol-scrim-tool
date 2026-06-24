const VERSION = '16.12.1'

export function championIconUrl(championName: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion/${championName}.png`
}
