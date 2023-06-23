import type { OutgoingHttpHeaders } from 'node:http'
import type { Options } from 'sirv'
import sirv from 'sirv'
import { consola } from 'consola'
import type { NextHandleFunction } from './index-html'

const knownJavascriptExtensionRE = /\.[tj]sx?$/

function sirvOptions({
  headers,
}: {
  headers?: OutgoingHttpHeaders
  shouldServe?: (p: string) => void
}): Options {
  return {
    dev: true,
    etag: true,
    extensions: [],
    setHeaders(res, pathname) {
      if (knownJavascriptExtensionRE.test(pathname))
        res.setHeader('Content-Type', 'application/javascript')

      if (headers) {
        for (const name in headers)
          res.setHeader(name, headers[name]!)
      }
    },
  }
}

export function servePublicMiddleware(
  dir: string,
): NextHandleFunction {
  const serve = sirv(
    dir,
    sirvOptions({ headers: undefined }),
  )

  return function vitemServeStaticMiddleware(
    req, res, next,
  ) {
    if (req.url.includes('.svg')) {
      consola.info('Serve', req.url)
      serve(req, res, next)
    }

    else { next() }
  }
}
