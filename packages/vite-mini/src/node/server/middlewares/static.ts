import sirv from 'sirv'
import type { NextHandleFunction } from './index-html'

export function servePublicMiddleware(
  dir: string,
): NextHandleFunction {
  const serve = sirv(
    dir,
  )

  return function vitemServeStaticMiddleware(
    req, res, next,
  ) {
    if (req.url.includes('.svg')) {
      res.set('Content-Type', 'image/svg+xml')
      serve(req, res, next)
    }
    else {
      next()
    }
  }
}
