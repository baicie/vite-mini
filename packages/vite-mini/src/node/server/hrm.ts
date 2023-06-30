import path from 'node:path'
import { consola } from 'consola'
import colors from 'picocolors'
import { normalizePath } from '../utils'
import type { ViteDevServer } from '.'

export function handkeHRMUpdate(
  id: string,
  server: ViteDevServer,
) {
  const timestamp = Date.now()
  const wss = server.ws
  const filePath = `/${normalizePath(path.relative(server.config.root, id))}`
  consola.log(colors.green(`file changed ${filePath}`))

  wss?.clients.forEach((client) => {
    client.send(JSON.stringify({
      type: 'update',
      path: filePath,
      fileType: 'vue',
      timestamp,
    }))
  })

  wss?.clients.forEach((client) => {
    client.send(JSON.stringify({
      type: 'update',
      path: `${filePath}?type=style`,
      fileType: 'vue',
      timestamp,
    }))
  })
}

export function injectHRMCode(
  id: string,
  code?: string,
) {
  // /@vitem/client
  const header = ['import {createHRMContext,exporthelper} from "/@vitem/client";',
  `const _hot_context = createHRMContext("${id}");`,
  ].join('\n')
  const footer = [
    `_sfc_main_.__hmrId = "${id}";`,
    'typeof __VUE_HMR_RUNTIME__ !== "undefined" && __VUE_HMR_RUNTIME__.createRecord(stdin_default.__hmrId, _sfc_main_);',
    '_hot_context?.update((mod) => {',
    'if (!mod)',
    'return;',
    'const { default: updated } = mod;',
    'console.log(JSON.stringify(mod.setup),mod.setup)',
    '__VUE_HMR_RUNTIME__.reload(updated.__hmrId, updated);',
    '})',
    'export default exporthelper(_sfc_main_,[]);',
  ].join('\n')

  return header + code?.replace('export { stdin_default as default };', '') + footer
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
