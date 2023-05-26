import type { ViteDevServer } from '../server'

export async function createDepsOptimizer(
  server: ViteDevServer,
) {
  console.log('createDepsOptimizer', server.config.root)
}
