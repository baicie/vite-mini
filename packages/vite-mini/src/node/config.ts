import path from 'node:path'
import fs from 'node:fs'
import { Buffer } from 'node:buffer'
import MagicStr from 'magic-string'
import { init as importInit, parse as importParse } from 'es-module-lexer'
import { consola } from 'consola'
import { CONFIGFILE, VITECACHE } from './constants'
import { createLogger } from './logger'
import type { InlineConfig, ViteDevServer } from './server'
import { dynamicImport, normalizePath } from './utils'
import { transformTypeScript } from './plugins/transform'

export interface UserConfigExport {
  server: {
    proxy: {}
  }
}

export async function resolveConfig(
  inlineConfig: InlineConfig = {},
): Promise<ViteDevServer['config']> {
  const root = normalizePath(process.cwd())

  const config = {
    ...inlineConfig,
    server: {
      strictPort: false,
    },
    root,
    logger: createLogger(),
    cacheDeps: {},
    transformCaches: {},
    cacheDir: path.join(normalizePath(process.cwd()), 'node_modules', VITECACHE, 'deps'),
    watcher: {
      disableGlobbing: true,
      ignorePermissionErrors: true,
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/test-results/**',
        `${root}/node_modules/.vite/**`,
      ],
      ignoreInitial: true,
    },
  }

  const fileConfig = resolveConfigFile(root)

  return config
}

async function resolveConfigFile(
  root: string,
) {
  try {
    const filePath = path.join(root, CONFIGFILE)
    const raw = fs.readFileSync(filePath, { encoding: 'utf8' })

    const code = await resolveConfigAndTransform(raw)

    const userConfig = await dynamicImport(
      `data:text/javascript;base64,${
            Buffer.from(code).toString('base64')}`,
    )

    consola.log('userConfig', userConfig)
  }
  catch (error) {
    consola.error(error)
  }
}

export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config
}

async function resolveConfigAndTransform(raw: string) {
  await importInit

  const js = await transformTypeScript(raw)

  const magicstr = new MagicStr(js)

  const [imports] = importParse(js)

  imports.forEach((imp) => {
    if (imp.n) {
      let vitemPath = path.join(path.dirname(__dirname), 'index.js')
      vitemPath = `file:///${vitemPath.replace(/\\/g, '/')}`

      magicstr.overwrite(imp.s, imp.e, vitemPath, { contentOnly: true })
    }
  })

  return magicstr.toString()
}
