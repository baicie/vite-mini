import path from 'node:path'
import fs from 'node:fs'
import esbuild from 'esbuild'
import type { ViteDevServer } from '../server'
import { METADATA, VITECACHE } from '../constants'
import { normalizePath } from '../utils'
import { loadCachedDepOptimizationMetadata } from './optimizer'
import { scanImports } from './scan'

export interface OptimizerMetadata {
  optimized: Record<string, {
    src: string
    file: string
  }>
  chunks: Record<string, {
    file: string
  }>
}

type OptimizerType = 'optimized' | 'chunks'

export async function createDepsOptimizer(
  server: ViteDevServer,
) {
  let metaData = await loadCachedDepOptimizationMetadata(server)
  let deps: Record<string, string> = {}

  if (!metaData) {
    deps = await scanImports(server.config)
    metaData = await runOptimizeDeps(server.config, deps)
  }

  const cachedDeps = server.config.cacheDeps
  for (const key of Object.keys(metaData.optimized)) {
    // 之前缓存的
    cachedDeps[key] = metaData.optimized[key].src
  }
}

export async function runOptimizeDeps(
  config: ViteDevServer['config'],
  deps: Record<string, string>,
) {
  const base = config.root
  const metadata: OptimizerMetadata = {
    optimized: {},
    chunks: {},
  }
  // 拼接缓存目录
  const depsCacgeDir = path.join(base, 'node_modules', VITECACHE, 'deps')
  // 创建dir
  fs.mkdirSync(depsCacgeDir, { recursive: true })

  fs.writeFileSync(
    path.resolve(depsCacgeDir, 'package.json'),
    '{\n  "type": "module"\n}\n',
  )

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

  const result = await context.rebuild().then((result) => {
    const output = result.metafile.outputs

    for (const item of Object.keys(output)) {
      if (!item.endsWith('.map')) {
        const type: OptimizerType = item.includes('chunk') ? 'chunks' : 'optimized'
        const basename = path.basename(item)
        setOptimizerMetadata(metadata, type, basename.replace(path.extname(basename), ''), {
          file: basename,
          src: normalizePath(path.relative(depsCacgeDir, output[item].entryPoint ?? '')),
        })
      }
    }

    fs.writeFileSync(
      path.resolve(depsCacgeDir, METADATA),
      JSON.stringify(metadata),
    )

    return metadata
  })

  return result
}

function setOptimizerMetadata(
  optimizer: OptimizerMetadata,
  type: OptimizerType,
  key: string,
  content: {
    file: string
    src: string
  },
) {
  optimizer[type][key] = content
}
