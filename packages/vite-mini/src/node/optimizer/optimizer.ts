import path from 'node:path'
import fsp from 'node:fs/promises'
import type { ViteDevServer } from '../server'
import { METADATA, VITECACHE } from '../constants'

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

async function loadCachedDepOptimizationMetadata(
  server: ViteDevServer,
): Promise<DepOptimizationMetadata | undefined> {
  const cachedMetadata: undefined | DepOptimizationMetadata = undefined
  const base = server.config.root
  const depsCacgeDir = path.join(base, 'node_modules', VITECACHE)
  const cacheMetaDataPath = path.join(depsCacgeDir, METADATA)

  fsp.readFile(cacheMetaDataPath, 'utf-8')

  return cachedMetadata
}
