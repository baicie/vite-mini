import path from 'node:path'
import fs from 'node:fs'
import history from 'connect-history-api-fallback'
import type { NextHandleFunction } from './index-html'

export function htmlFallBackMiddleware(
  root: string,
): NextHandleFunction {
  const historyHtmlFallbackMiddleware = history({
    rewrites: [
      {
        from: /\/$/,
        to({ parsedUrl }: any) {
          const rewritten
            = `${decodeURIComponent(parsedUrl.pathname)}index.html`

          if (fs.existsSync(path.join(root, rewritten)))
            return rewritten

          return '/index.html'
        },
      },
    ],
  })

  // 给根路径加上index.html

  return function vitemHistoryHtmlFallbackMiddleware(req, res, next) {
    return historyHtmlFallbackMiddleware(req, res, next)
  }
}
