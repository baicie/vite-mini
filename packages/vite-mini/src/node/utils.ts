import crypto from 'node:crypto'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import debug from 'debug'
import { loopbackHosts } from './constants'
import type { CommonServerOptions } from './http'
import type { ResolvedServerUrls } from './server'

export async function resolveHostname(
  optionsHost: string | boolean | undefined,
) {
  let host: string | undefined

  if (!optionsHost)
    host = 'localhost'
  else if (optionsHost === true)
    host = undefined
  else
    // 相当于在配置文件写的端口号
    host = optionsHost

  return {
    host: host ?? 'localhost',
    name: host ?? 'localhost',
  }
}

// 重写一下
export async function resolveServerUrls(
  server: Server,
  options: CommonServerOptions,
): Promise<ResolvedServerUrls> {
  const address = server.address()

  const isAddressInfo = (x: any): x is AddressInfo => x?.address
  if (!isAddressInfo(address))
    return { local: [], network: [] }

  const local: string[] = []
  const network: string[] = []
  const hostname = await resolveHostname(options.host)
  const protocol = 'http'
  const port = address.port
  const base = '/'

  if (hostname.host && loopbackHosts.has(hostname.host)) {
    let hostnameName = hostname.name
    // ipv6 host
    if (hostnameName?.includes(':'))
      hostnameName = `[${hostnameName}]`

    local.push(`${protocol}://${hostnameName}:${port}${base}`)
  }
  else {
    Object.values(os.networkInterfaces())
      .flatMap(nInterface => nInterface ?? [])
      .filter(
        detail =>
          detail
          && detail.address
          && (detail.family === 'IPv4'
            // @ts-expect-error Node 18.0 - 18.3 returns number
            || detail.family === 4),
      )
      .forEach((detail) => {
        let host = detail.address.replace('127.0.0.1', hostname.host)
        // ipv6 host
        if (host.includes(':'))
          host = `[${host}]`

        const url = `${protocol}://${host}:${port}${base}`
        if (detail.address.includes('127.0.0.1'))
          local.push(url)

        else
          network.push(url)
      })
  }
  return { local, network, port }
}

const postfixRE = /[?#].*$/s
export function cleanUrl(url: string): string {
  return url.replace(postfixRE, '')
}

export const isWindows = os.platform() === 'win32'

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

const windowsSlashRE = /\\/g
export function slash(p: string): string {
  return p.replace(windowsSlashRE, '/')
}

export type ViteMDebugScope = `vitem:${string}`

export function createDebugger(
  namespace: ViteMDebugScope,
): debug.Debugger['log'] | undefined {
  const log = debug(namespace)

  const enabled = log.enabled

  if (enabled) {
    return (...args: [string, ...any[]]) => {
      log(...args)
    }
  }
}

// 裸模块 npm包
export const bareImportRE = /^(?![a-zA-Z]:)[\w@](?!.*:\/\/)/

// eslint-disable-next-line n/prefer-global/buffer
export function getHash(text: Buffer | string): string {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 8)
}

export function clearUrl(url: string): string {
  return url.split('?')[0]
}
