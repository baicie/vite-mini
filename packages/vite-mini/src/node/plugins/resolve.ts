import path from 'node:path'
import fs from 'node:fs'
import colors from 'picocolors'
import type { NormalizedPackageJson } from 'read-pkg'
import { readPackageSync } from 'read-pkg'

import type { ViteDevServer } from '../server'
import { bareImportRE, createDebugger, isWindows, normalizePath } from '../utils'

const debug = createDebugger('vitem:resolve')

export function resolveId(
  id: string,
  config: ViteDevServer['config'],
  importer: string,
) {
  const getcacheDep = config.cacheDeps[id]
  let res = id
  if (getcacheDep)
    return getcacheDep

  // url
  if (id.startsWith('/')) {
    res = normalizePath(path.join(config.root, id))
    debug?.(`[url] ${colors.cyan(id)} -> ${colors.dim(res)}`)
  }

  // relative
  if (id.startsWith('.')) {
    const basePath = path.dirname(importer)
    res = normalizePath(path.join(basePath, id))
    debug?.(`[relative] ${colors.cyan(id)} -> ${colors.dim(res)}`)
  }

  //

  if (bareImportRE.test(id)) {
    res = resolveBareImportId(id, config, importer)
    debug?.(`[bareImportRE] ${colors.cyan(id)} -> ${colors.dim(res)}`)
  }

  if (id !== res)
    config.cacheDeps[id] = res

  return normalizePath(res)
}

// 返回最终地址
function resolveBareImportId(
  id: string,
  config: ViteDevServer['config'],
  importer: string,
) {
  const { pkgData = {}, pkgPath = '' } = resolvePackageData(id, config, importer)

  let module = ''

  if (pkgData.module) {
    module = pkgData.module
  }
  else if (pkgData.exports) {
    // module = pkgData.exports['.'].default
  }

  const res = path.join(pkgPath, module)

  return res
}

// 加载packagedata
function resolvePackageData(
  id: string,
  config: ViteDevServer['config'],
  importer: string,
): {
    pkgData: undefined | NormalizedPackageJson
    pkgPath: string
  } | undefined {
  let basedir = config.root
  while (basedir) {
    // 获取地址
    const dir = path.join(basedir, 'node_modules', id)
    if (fs.existsSync(dir)) {
      // 是否是软连接
      const isLink = fs.lstatSync(dir).isSymbolicLink()
      const pkgPath = isLink ? resolveSymbolicLink(dir) : dir
      // 读取内容
      const res = readPackageSync({ cwd: pkgPath })

      return {
        pkgData: res,
        pkgPath,
      }
    }
    else {
      basedir = path.dirname(basedir)
    }
  }
}

// 获取软连接地址
function resolveSymbolicLink(id: string): string {
  return isWindows ? fs.readlinkSync(id) : fs.realpathSync.native(id)
}
