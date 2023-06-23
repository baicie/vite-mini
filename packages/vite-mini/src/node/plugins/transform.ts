import type { Loader } from 'esbuild'
import esbuild from 'esbuild'
import * as vueCompiler from '@vue/compiler-sfc'
import type { ViteDevServer } from '../server'
import {} from '@vitejs/plugin-vue'

// 转换资源 转换js
export async function transfromCode(
  id: string,
  code: string,
  config: ViteDevServer['config'],
) {
  let temp = code
  if (id.endsWith('.vue')) {
    const vueToJs = transformVue(
      id, code,
    )

    temp = vueToJs
  }
  else if (id.endsWith('.css') || id.includes('type=style')) {
    temp = transformCss(id, code)
  }

  const loader: Loader = 'ts'

  const res = await esbuild.transform(temp, {
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

function transformVue(
  id: string,
  source: string,
): string {
  const { descriptor } = vueCompiler.parse(source)
  let code = ''

  const script = vueCompiler.compileScript(descriptor, {
    id: descriptor.filename,
    inlineTemplate: true,
  })

  if (script)
    code += vueCompiler.rewriteDefault(script.content, '_sfc_main_')

  // if (descriptor.template) {
  //   const temp = vueCompiler.compileTemplate({
  //     source: descriptor.template.content,
  //     filename: descriptor.filename,
  //     id: descriptor.filename,
  //   })

  //   code += `\n${temp.code}`
  //   code += '\n_sfc_main_.render = render'
  // }

  if (descriptor.styles)
    code += `\nimport '${id}?type=style'`

  code += '\nexport default _sfc_main_'

  return code
}

function transformCss(
  id: string,
  source: string,
) {
  let cssCode = source
  if (id.includes('type=style')) {
    const { descriptor } = vueCompiler.parse(source)
    cssCode = vueCompiler.compileStyle({
      id,
      filename: id,
      source: descriptor.styles.map(style => style.content).join('\n'),
    }).code
  }

  const code = `
  function insertStyle(css) {\n
    const el = document.createElement('style')\n
    el.setAttribute('type', 'text/css')\n
    el.textContent = css\n
    document.head.appendChild(el)\n
    console.log('  1111')\n
  }\n
  insertStyle(${JSON.stringify(cssCode)})\n
  export default insertStyle
`
  return code
}
