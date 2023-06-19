import path from 'node:path'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import type { ViteDevServer } from '../server'
import { METADATA, VITECACHE } from '../constants'
import type { OptimizerMetadata } from './index'

export interface ExportsData {
  hasImports: boolean
  exports: readonly string[]
}

export interface OptimizedDepInfo {
  id: string
  file: string
  src?: string
  needsInterop?: boolean
  browserHash?: string
  fileHash?: string
  processing?: Promise<void>
  exportsData?: Promise<ExportsData>
}

export interface DepOptimizationMetadata {
  hash: string
  browserHash: string
  optimized: Record<string, OptimizedDepInfo>
  chunks: Record<string, OptimizedDepInfo>
  discovered: Record<string, OptimizedDepInfo>
  depInfoList: OptimizedDepInfo[]
}

export async function loadCachedDepOptimizationMetadata(
  server: ViteDevServer,
): Promise<OptimizerMetadata | undefined> {
  let cachedMetadata: undefined | OptimizerMetadata
  try {
    const base = server.config.root
    const depsCacgeDir = path.join(base, 'node_modules', VITECACHE, 'deps')
    const cacheMetaDataPath = path.join(depsCacgeDir, METADATA)
    if (!fs.existsSync(cacheMetaDataPath))
      return cachedMetadata
    cachedMetadata = JSON.parse(await fsp.readFile(cacheMetaDataPath, 'utf-8'))
  }
  catch (error) {
    console.error(error)
  }

  return cachedMetadata
}
