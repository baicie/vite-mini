import type { ViteDevServer } from '../server'
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
  console.log('runOptimizeDeps', config, deps)
}
