import path from 'node:path'
import fs from 'node:fs'
import type { ViteDevServer } from '../server'
import { VITECACHE } from '../constants'
import { loadCachedDepOptimizationMetadata } from './optimizer'
import { scanImports } from './scan'

export async function createDepsOptimizer(
  server: ViteDevServer,
) {
  const metaData = await loadCachedDepOptimizationMetadata(server)
  let deps: Record<string, string> = {}
  if (!metaData)
    deps = await scanImports(server.config)

  //
  runOptimizeDeps(server.config, deps)
}

export function runOptimizeDeps(
  config: ViteDevServer['config'],
  deps: Record<string, string>,
) {
  const base = config.root
  // 拼接缓存目录
  const depsCacgeDir = path.join(base, 'node_modules', VITECACHE)
  // 创建dir
  fs.mkdirSync(depsCacgeDir, { recursive: true })

  fs.writeFileSync(
    path.resolve(depsCacgeDir, 'package.json'),
    '{\n  "type": "module"\n}\n',
  )

  // prepareEsbuildOptimizerRun
}
