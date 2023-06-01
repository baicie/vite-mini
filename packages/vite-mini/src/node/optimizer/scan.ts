import path from 'node:path'
import fsp from 'node:fs/promises'
import type { Plugin } from 'esbuild'
import esbuild from 'esbuild'
import type { ViteDevServer } from '../server'

export async function scanImports(
  config: ViteDevServer['config'],
) {
  console.log('scanImports')
  const deps: Record<string, string> = {}

  const filename = path.join(config.root, '/index.html')

  const plugin = esbuildScanPlugin(config, deps)

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

  res.rebuild().then(() => {
    console.log('rebuild', deps)
  })
}

const htmlTypesRE = /\.(html|vue)$/
export const scriptRE
  = /(<script(?:\s+[a-z_:][-\w:]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^"'<>=\s]+))?)*\s*>)(.*?)<\/script>/gis
const srcRE = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i

function esbuildScanPlugin(
  config: ViteDevServer['config'],
  deps: Record<string, string>,
): Plugin {
  console.log('esbuildScanPlugin')

  return {
    name: 'vitem:dep-scan',
    setup(build) {
      build.onResolve({
        filter: htmlTypesRE,
      }, ({ path }) => {
        const temp = path
        if (path.includes('.html')) {
          return {
            path: temp,
            namespace: 'html',
          }
        }
      })

      build.onLoad(
        { filter: htmlTypesRE, namespace: 'html' },
        async ({ path }) => {
          const raw = await fsp.readFile(path, 'utf-8')
          let js = ''
          // while ((match = scriptRE.exec(raw))) {

          // }
          // 匹配文件中的特定字符 如果有多个可以搭配while匹配多个
          // 只做单个入口
          if (path.endsWith('.html')) {
            const match = srcRE.exec(raw)
            if (match) {
              const src = match[0]
              js += 'import' + ` ${src.replace('src=', '')}`
              return {
                loader: 'js',
                contents: js,
              }
            }
          }
        },
      )

      build.onResolve(
        {
          filter: /.*/,
        },
        async ({ path: id, importer, pluginData }) => {
          console.log(id, importer, pluginData)
          return {}
        },
      )

      build.onResolve(({ filter: /^[\w@][^:]/ }), async ({ path: id, importer, pluginData }) => {
        console.log(id, importer, pluginData)
        return {
          path: id,
        }
      })
    },
  }
}
