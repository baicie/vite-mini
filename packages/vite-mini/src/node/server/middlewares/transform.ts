import fs from 'node:fs'
import path from 'node:path'
import { init as importInit, parse as importParse } from 'es-module-lexer'
import type { NextFunction, Request, Response } from 'express'
import MagicStr from 'magic-string'
import { consola } from 'consola'
import colors from 'picocolors'
import { resolveId } from '../../plugins/resolve'
import { clearUrl, createDebugger, normalizePath } from '../../utils'
import type { ViteDevServer } from '../index'
import { send } from '../send'
import { transformJavascript, transfromCode } from '../../plugins/transform'
import { INJECTION } from '../../constants'
import { injectHRMCode, injectHRMCss } from '../hrm'
import type { NextHandleFunction } from './index-html'

const debug = createDebugger('vitem:transfrom')

export function transfromMiddleware(
  server: ViteDevServer,
): NextHandleFunction {
  return async function vitemTransformMiddleware(
    req: Request, res: Response, next: NextFunction,
  ) {
    const type = req.params.type
    if (['.ts', '.js', '.css', '.vue'].some(item => req.url.includes(item))
      || type === 'style'
    ) {
    // 拿到最后返回结果
      debug?.(colors.red(`--> ${req.url}`))
      const result = await resolveCodeAndTransForm(
        req.url,
        server.config,
      ) ?? ''

      return send(req, res, result, 'js', {})
    }
    else if (req.url === INJECTION) {
      const clientPath = path.join(path.dirname(path.dirname(__dirname)), 'client', 'client.mjs')
      let result = await transformJavascript(
        clientPath,
        server.config,
      )

      result = replaceClientEnv(result, server)

      return send(req, res, result, 'js', {})
    }
    else {
      next()
    }
  }
}

function replaceClientEnv(code: string, server: ViteDevServer) {
  return code.replace('__SERVER_HOST__', JSON.stringify(server.resolvedUrls?.port))
}

async function resolveCodeAndTransForm(
  id: string,
  config: ViteDevServer['config'],
) {
  if (id === '/')
    return
  const sourceId = clearUrl(resolveId(
    id,
    config,
    '',
  ))

  if (!fs.existsSync(sourceId))
    return
  // 拿到源码
  const code = fs.readFileSync(sourceId, { encoding: 'utf-8' })

  const jscode = await transfromCode(sourceId, code, id)

  const importResetCode = await transfromImport(
    sourceId,
    jscode,
    config,
  )

  // vue hrm
  let res = ''
  if (sourceId.endsWith('.vue') && !id.includes('type=style')) {
    res = injectHRMCode(
      id,
      importResetCode,
    )
  }
  // css update
  else if (id.endsWith('.css') || id.includes('type=style')) {
    res = injectHRMCss(
      id,
      importResetCode,
    )
  }
  // ts reload
  else {
    res = importResetCode ?? ''
  }

  return res
}

// 转换import
async function transfromImport(
  id: string,
  source: string,
  config: ViteDevServer['config'],
) {
  try {
    await importInit

    const magicstr = new MagicStr(source)

    const [imports, exports] = importParse(source)

    imports.forEach((imp) => {
      if (imp.n) {
        const resId = resolveId(
          imp.n,
          config,
          id,
        )
        const newPath = `/${normalizePath(path.relative(config.root, resId))}`

        magicstr.overwrite(imp.s, imp.e, newPath, { contentOnly: true })
      }
    })
    if (id.endsWith('.vue')) {
      exports.forEach((exp) => {
        if (exp.n)
          magicstr.overwrite(exp.ls, exp.e, '', { contentOnly: true })
      })
    }

    return magicstr.toString()
  }
  catch (error) {
    consola.error(error)
  }
}

// 源码逻辑备注
// 1.transformMiddleware
// 主要负责请求相关的东西
// 2.transformRequest
// 中间存在一个缓存 加载后处理完代码后统一返回？
// 3.doTransform
// 先执行resolveId获取当前请求对应文件位置 对应plugin resolve
// 4.loadAndTransform
// 使用load方法去加载源码 load中使用三方es-module-lexer 获取import export然后进行操作 对应plugin import-analysis
// 将操作后的文件返回
// 执行transform将文件转换为js  对应plugin esbuild
// 最后在返回code
