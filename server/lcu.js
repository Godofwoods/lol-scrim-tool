import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'

export function getLCUCredentials() {
  // Method 1: parse WMIC process command line
  try {
    const output = execSync(
      'wmic PROCESS WHERE "name=\'LeagueClientUx.exe\'" GET commandline',
      { encoding: 'utf-8', timeout: 5000 }
    )

    const portMatch = output.match(/--app-port=(\d+)/)
    const tokenMatch = output.match(/--remoting-auth-token=([\w-]+)/)
    const installMatch = output.match(/--install-directory=([^\s"]+)/)

    if (portMatch && tokenMatch) {
      return {
        port: parseInt(portMatch[1]),
        password: tokenMatch[1],
        protocol: 'https',
        installDir: installMatch ? installMatch[1] : null
      }
    }
  } catch {
    // WMIC failed, try lockfile
  }

  // Method 2: try common lockfile locations
  const lockfilePaths = [
    'C:/Riot Games/League of Legends/lockfile',
    'D:/Riot Games/League of Legends/lockfile',
    'C:/Program Files/Riot Games/League of Legends/lockfile',
    'D:/Program Files/Riot Games/League of Legends/lockfile'
  ]

  for (const lockfilePath of lockfilePaths) {
    try {
      const content = readFileSync(lockfilePath, 'utf-8')
      const parts = content.split(':')
      if (parts.length >= 5) {
        return {
          port: parseInt(parts[2]),
          password: parts[3],
          protocol: parts[4].trim(),
          installDir: path.dirname(lockfilePath)
        }
      }
    } catch {
      continue
    }
  }

  return null
}

export function createLCUFetcher(credentials) {
  const { port, password, protocol } = credentials
  const base = `${protocol}://127.0.0.1:${port}`
  const auth = Buffer.from(`riot:${password}`).toString('base64')

  return async function lcuFetch(endpoint) {
    const res = await fetch(`${base}${endpoint}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`LCU ${res.status}: ${text}`)
    }
    return res.json()
  }
}
