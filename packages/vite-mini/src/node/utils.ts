import os from 'node:os'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { CommonServerOptions } from './http'
import type { ResolvedServerUrls } from './server'
import { loopbackHosts } from './constants'

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
    host,
    name: host,
  }
}

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
  return { local, network }
}
