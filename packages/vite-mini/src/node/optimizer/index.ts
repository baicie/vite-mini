import path from 'node:path'
import fs from 'node:fs'
import esbuild from 'esbuild'
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

export async function runOptimizeDeps(
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
  console.log('runOptimizeDeps', deps)
  // prepareEsbuildOptimizerRun
  const context = await esbuild.context({
    absWorkingDir: process.cwd(),
    entryPoints: Object.keys(deps),
    bundle: true,
    platform: 'browser',
    format: 'esm',
    logLevel: 'error',
    external: [],
    target: 'es2020',
    splitting: true,
    sourcemap: true,
    outdir: depsCacgeDir,
    ignoreAnnotations: true,
    metafile: true,
    charset: 'utf8',
  })

  context.rebuild().then((result) => {
    const output = result.metafile.outputs
    console.log(Object.keys(result.metafile.inputs).length)
    for (const item of Object.keys(output))
      console.log(item)
  })
}
