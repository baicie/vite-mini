import type { NextFunction, Request, Response } from 'express'
import type { ViteDevServer } from '../index'
import type { NextHandleFunction } from './index-html'

export function transformMiddleware(
  server: ViteDevServer,
): NextHandleFunction {
  return function vitemTransformMiddleware(
    req: Request, res: Response, next: NextFunction,
  ) {
    console.log(server.config, req.url)
    next()
  }
}
