import path from 'node:path'
import { consola } from 'consola'
import colors from 'picocolors'
import { normalizePath } from '../utils'
import type { ViteDevServer } from '.'

export function handkeHRMUpdate(
  id: string,
  server: ViteDevServer,
) {
  const wss = server.ws
  const filePath = `/${normalizePath(path.relative(server.config.root, id))}`
  consola.log(colors.green(`file changed ${filePath}`))

  wss?.clients.forEach((client) => {
    client.send(JSON.stringify({
      type: 'update',
      data: filePath,
      fileType: 'vue',
    }))
  })
}

export function injectHRMCode(
  id: string,
  code?: string,
) {
  // /@vitem/client
  const header = 'import {createHRMContext} from "/@vitem/client";\n'
  + `const _hot_context = createHRMContext("${id}");\n`
  const footer = [
    `_sfc_main_.__hmrId = "${id}";`,
    '_hot_context?.update((mod) => {',
    'if (!mod)',
    'return;',
    'const { default: updated } = mod;',
    'console.log(updated)',
    '__VUE_HMR_RUNTIME__.reload(updated.__hmrId, updated);',
    '})',
  ].join('\n')

  return header + code + footer
}

export function injectHRMCss(
  id: string,
  code?: string,
) {
  const header = 'import {createHRMContext} from "/@vitem/client";\n'
  + `const _hot_context = createHRMContext("${id}");\n`
  const footer = [
    '_hot_context?.update((mod) => {',
    'console.log(mod)',
    '})',
  ].join('\n')

  return header + code + footer
}
