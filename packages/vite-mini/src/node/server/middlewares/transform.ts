import fs from 'node:fs'
import type { NextFunction, Request, Response } from 'express'
import type { ViteDevServer } from '../index'
import { createDebugger } from '../../utils'
import { resolveId } from '../../plugins/resolve'
import { transfromCode } from '../../plugins/transform'
import type { NextHandleFunction } from './index-html'

const debug = createDebugger('vitem:transfromMiddleware')

export function transfromMiddleware(
  server: ViteDevServer,
): NextHandleFunction {
  return async function vitemTransformMiddleware(
    req: Request, res: Response, next: NextFunction,
  ) {
    const result = await resolveCodeAndTransForm(
      req.url,
      server.config,
    )
    next()
  }
}

async function resolveCodeAndTransForm(
  id: string,
  config: ViteDevServer['config'],
) {
  if (id === '/')
    return
  const sourceId = resolveId(
    id,
    config,
    '',
  )

  const code = fs.readFileSync(sourceId, { encoding: 'utf-8' })
  const responseCode = await transfromCode(id, code, config)

  const res = transfromImport(
    id,
    responseCode,
    config,
  )

  console.log(res)
}

// 转换引用
async function transfromImport(
  id: string,
  code: string,
  config: ViteDevServer['config'],
) {

}
