import path from 'node:path'
import { consola } from 'consola'
import colors from 'picocolors'
import { normalizePath } from '../utils'
import type { ViteDevServer } from '.'

export function handkeHRMUpdate(
  id: string,
  server: ViteDevServer,
) {
  const wss = server.ws
  const filePath = `/${normalizePath(path.relative(server.config.root, id))}`
  consola.log(colors.green(`file changed ${filePath}`))

  wss?.clients.forEach((client) => {
    client.send(JSON.stringify({
      type: 'update',
      data: filePath,
    }))
  })
}

export function injectHRMCode() {}
