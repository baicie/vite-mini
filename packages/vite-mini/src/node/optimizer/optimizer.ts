import path from 'node:path'
import fsp from 'node:fs/promises'
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

export async function loadCachedDepOptimizationMetadata(
  server: ViteDevServer,
): Promise<OptimizerMetadata | undefined> {
  let cachedMetadata: undefined | OptimizerMetadata
  try {
    const base = server.config.root
    const depsCacgeDir = path.join(base, 'node_modules', VITECACHE, 'deps')
    const cacheMetaDataPath = path.join(depsCacgeDir, METADATA)

    cachedMetadata = JSON.parse(await fsp.readFile(cacheMetaDataPath, 'utf-8'))
  }
  catch (error) {

  }

  return cachedMetadata
}
