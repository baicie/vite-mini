import path from 'node:path'
import fsp from 'node:fs/promises'
import type { Plugin } from 'esbuild'
import esbuild from 'esbuild'
import type { ViteDevServer } from '../server'

export async function scanImports(
  config: ViteDevServer['config'],
) {
  const deps: Record<string, string> = {}

  const filename = path.join(config.root, '/index.html')

  const plugin = esbuildScanPlugin()
  console.log('__filename22', __filename)
  const res = await esbuild.context({
    absWorkingDir: process.cwd(),
    write: false,
    stdin: {
      contents: `import ${JSON.stringify(filename)}`,
      loader: 'js',
    },
    bundle: true,
    format: 'esm',
    logLevel: 'silent',
    plugins: [plugin],
    preserveSymlinks: false,
  })
}

const htmlTypesRE = /\.(html)$/
export const scriptRE
  = /(<script(?:\s+[a-z_:][-\w:]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^"'<>=\s]+))?)*\s*>)(.*?)<\/script>/gis

function esbuildScanPlugin(

): Plugin {
  return {
    name: 'vitem:dep-scan',
    setup(build) {
      build.onLoad(
        { filter: htmlTypesRE },
        async ({ path }) => {
          const raw = await fsp.readFile(path, 'utf-8')
          const js = ''
          const isHtml = path.endsWith('.html')

          // while ((match = scriptRE.exec(raw))) {

          // }

          return {
            loader: 'ts',
            contents: js,
          }
        },
      )
    },
  }
}
