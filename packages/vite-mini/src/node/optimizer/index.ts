import type { ViteDevServer } from '../server'
import { loadCachedDepOptimizationMetadata } from './optimizer'
import { scanImports } from './scan'

export async function createDepsOptimizer(
  server: ViteDevServer,
) {
  const metaData = await loadCachedDepOptimizationMetadata(server)
  if (!metaData)
    scanImports(server.config)
}
