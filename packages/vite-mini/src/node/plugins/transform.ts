import path from 'node:path'
import type { Loader } from 'esbuild'
import esbuild from 'esbuild'
import * as vueCompiler from '@vue/compiler-sfc'
import type { ViteDevServer } from '../server'

// 转换资源 转换js
export async function transfromCode(
  id: string,
  code: string,
  config: ViteDevServer['config'],
) {
  if (id.endsWith('.vue')) {
    const vueToJs = transformVue(
      id, code, config,
    )
    console.log(vueToJs)
    return vueToJs
  }
  else {
    let loader: Loader = 'ts'
    if (id.endsWith('.css'))
      loader = 'css'
    else if (id.endsWith('.js'))
      loader = 'js'

    const res = await esbuild.transform(code, {
      loader,
      platform: 'browser',
      format: 'esm',
      logLevel: 'error',
      target: 'es2020',
      sourcemap: true,
      charset: 'utf8',
    })

    return res.code
  }
}

function transformVue(
  id: string,
  source: string,
  config: ViteDevServer['config'],
): string {
  const { descriptor } = vueCompiler.parse(source)
  let code = ''

  const script = vueCompiler.compileScript(descriptor, {
    id,
  })

  if (script)
    code += vueCompiler.rewriteDefault(script.content, '_sfc_main_')

  if (descriptor.template) {
    const temp = vueCompiler.compileTemplate({
      source: descriptor.template.content,
      filename: path.basename(id),
      id,
    })

    code += temp.code
    code += '\n_sfc_main_.render = render'
  }

  if (descriptor.styles) {
    // const css = vueCompiler.compileStyle({
    //   source: descriptor.styles.map(style => style.content).join('\n'),
    //   id,
    //   filename: path.basename(id),
    // })

    code += `\nimport '${id}?type=style'`
  }

  return code
}
