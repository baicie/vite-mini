import fs from 'node:fs'
import path from 'node:path'
import type { NextFunction, Request, Response } from 'express'
import type { ViteDevServer } from '..'
import { send } from '../send'

export type NextHandleFunction = (req: Request, res: Response, next: NextFunction) => void

export function indexHtmlMiddleware(
  server: ViteDevServer,
): NextHandleFunction {
  return function vitemIndexHtmlMiddleware(
    req: Request, res: Response, next: NextFunction,
  ) {
    const url = req.url
    if (url.endsWith('.html')) {
      const filename = path.join(server.config.root, url.replace(/\\/g, '/'))
      if (fs.existsSync(filename)) {
        try {
          const html = fs.readFileSync(filename, 'utf-8')
          res.set('Content-Type', 'text/html')
          return send(req, res, html, 'html', {

          })
        }
        catch (error) {
          return next(error)
        }
      }
    }
    next()
  }
}
