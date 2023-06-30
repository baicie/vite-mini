import fs from 'node:fs'
import type { Loader } from 'esbuild'
import esbuild from 'esbuild'
import * as vueCompiler from '@vue/compiler-sfc'
import type { ViteDevServer } from '../server'
import { resolveId } from './resolve'

// 转换资源 转换js
export async function transfromCode(
  id: string,
  code: string,
  origin: string,
) {
  let temp = code
  if (id.endsWith('.vue') && !origin.includes('type=style')) {
    const vueToJs = transformVue(
      id, code,
    )

    temp = vueToJs
  }
  else if (id.endsWith('.css') || origin.includes('type=style')) {
    temp = transformCss(origin, code)
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

  const code = [
    'function insertStyle(css) {',
    'const el = document.createElement(\'style\')',
    'el.setAttribute(\'type\', \'text/css\')',
    `el.setAttribute(\'souceId\', "${id}")`,
    'el.textContent = css',
    'document.head.appendChild(el)',
    '}',
    `insertStyle(${JSON.stringify(cssCode)})`,
    'export default insertStyle',
  ].join('\n')
  return code
}

export async function transformJavascript(
  id: string,
  config: ViteDevServer['config'],
) {
  const loader: Loader = 'ts'

  const resolve = resolveId(id, config, '')

  const source = fs.readFileSync(resolve)

  const res = await esbuild.transform(source, {
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

export async function transformTypeScript(
  code: string,
) {
  const res = await esbuild.transform(code, {
    loader: 'ts',
    platform: 'browser',
    format: 'esm',
    logLevel: 'error',
    target: 'es2020',
    sourcemap: true,
    charset: 'utf8',
  })

  return res.code
}
