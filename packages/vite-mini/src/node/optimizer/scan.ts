import path from 'node:path'
import fsp from 'node:fs/promises'
import type { Loader, OnLoadResult, Plugin } from 'esbuild'
import esbuild from 'esbuild'
import type { ViteDevServer } from '../server'
import { resolveId } from '../plugins/resolve'
import { CSS_LANGS_RE, JS_TYPES_RE } from '../constants'

export async function scanImports(
  config: ViteDevServer['config'],
) {
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
export const virtualModuleRE = /^virtual-module:.*/
export const virtualModulePrefix = 'virtual-module:'

function esbuildScanPlugin(
  config: ViteDevServer['config'],
  deps: Record<string, string>,
): Plugin {
  // 缓存处理后的vue script代码用于onload返回
  const scripts: Record<string, OnLoadResult> = {}
  return {
    name: 'vitem:dep-scan',
    setup(build) {
      build.onResolve({ filter: CSS_LANGS_RE }, externalUnlessEntry)

      build.onResolve({
        filter: htmlTypesRE,
      }, ({ path: id, importer }) => {
        const rosolveId = resolveId(id, config, importer)
        return {
          path: rosolveId,
          namespace: 'html',
        }
      })

      // 处理 virtual-module
      build.onResolve({ filter: virtualModuleRE }, ({ path }) => {
        return {
          path: path.replace(virtualModulePrefix, ''),
          namespace: 'script',
        }
      })

      build.onResolve(({ filter: /^[\w@][^:]/ }), async ({ path: id, importer, pluginData }) => {
        const rosolveId = resolveId(id, config, importer)
        if (rosolveId) {
          deps[id] = id
          return {
            path: rosolveId,
          }
        }
        else {
          // 不支持的类型
          return externalUnlessEntry({ path: id })
        }
      })

      // 入口派发
      build.onResolve(
        {
          filter: /.*/,
        },
        async ({ path: id, importer, pluginData }) => {
          const rosolveId = resolveId(id, config, importer)
          if (rosolveId) {
            return {
              path: rosolveId,
              namespace: htmlTypesRE.exec(rosolveId) ? 'html' : undefined,
            }
          }
          else {
            // 不支持的类型
            return externalUnlessEntry({ path: id })
          }
        },
      )

      // 处理vue script
      build.onLoad({ filter: /.*/, namespace: 'script' }, ({ path }) => {
        return scripts[path]
      })

      // 处理html vue内容
      build.onLoad(
        { filter: htmlTypesRE, namespace: 'html' },
        async ({ path }) => {
          const raw = await fsp.readFile(path, 'utf-8')
          let js = ''
          let scriptId = 0
          let match: RegExpExecArray | null
          if (path.endsWith('.vue')) {
            while ((match = scriptRE.exec(raw))) {
              const [,,content] = match
              const key = `${path}?id=${scriptId++}`

              const contents = content + extractImportPaths(content)
              scripts[key] = {
                loader: 'ts',
                contents,
                pluginData: {
                  htmlType: { loader: 'ts' },
                },
              }

              const vartualPath = `"${virtualModulePrefix}${key}"`
              js += `export * from ${vartualPath}\n`
            }

            js += '\nexport default {}'
            return {
              loader: 'ts',
              contents: js,
            }
          }

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

      // 处理js相关内容
      build.onLoad({ filter: JS_TYPES_RE }, async ({ path: id }) => {
        let ext = path.extname(id).split('.')[1]
        if (ext === 'mjs')
          ext = 'js'

        const contents = await fsp.readFile(id, 'utf-8')

        return {
          loader: ext as Loader,
          contents,
        }
      })

      // css怎么进来的
      build.onLoad({ filter: CSS_LANGS_RE }, () => {
        return {

        }
      })
    },
  }
}

function externalUnlessEntry({ path }: { path: string }) {
  return {
    path,
    external: true,
  }
}

export const multilineCommentsRE = /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g
export const singlelineCommentsRE = /\/\/.*/g
export const requestQuerySplitRE = /\?(?!.*[/|}])/
export const importsRE
  = /(?<!\/\/.*)(?<=^|;|\*\/)\s*import(?!\s+type)(?:[\w*{}\n\r\t, ]+from)?\s*("[^"]+"|'[^']+')\s*(?=$|;|\/\/|\/\*)/gm
function extractImportPaths(code: string) {
  // empty singleline & multiline comments to avoid matching comments
  code = code
    .replace(multilineCommentsRE, '/* */')
    .replace(singlelineCommentsRE, '')

  let js = ''
  let m
  importsRE.lastIndex = 0
  while ((m = importsRE.exec(code)) != null)
    js += `\nimport ${m[1]}`

  return js
}
