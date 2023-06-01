import path from 'node:path'
import colors from 'picocolors'
import type { ViteDevServer } from '../server'
import { createDebugger, normalizePath } from '../utils'

const debug = createDebugger('vitem:resolve')

export function resolveId(
  id: string,
  config: ViteDevServer['config'],
  importer: string,
) {
  if (id.startsWith('/')) {
    const res = normalizePath(path.join(config.root, id))

    debug?.(`[url] ${colors.cyan(id)} -> ${colors.dim(res)}`)
    console.log(res)
    return res
  }

  if (id.startsWith('.')) {
    const basePath = path.dirname(importer)
    const res = normalizePath(path.join(basePath, id))

    debug?.(`[url] ${colors.cyan(id)} -> ${colors.dim(res)}`)
    console.log(res)
    return res
  }

  return id
}
