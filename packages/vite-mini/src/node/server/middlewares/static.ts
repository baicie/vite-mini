import type { OutgoingHttpHeaders } from 'node:http'
import path from 'node:path'
import type { Options } from 'sirv'
import sirv from 'sirv'
import { cleanUrl } from '../../utils'
import { send } from '../send'
import type { ViteDevServer } from '..'
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
  config: ViteDevServer['config'],
): NextHandleFunction {
  const servePublic = sirv(
    path.resolve(config.root, 'public'),
    sirvOptions({ headers: undefined }),
  )

  const serveRoot = sirv(
    path.resolve(config.root),
    sirvOptions({ headers: undefined }),
  )

  return function vitemServeStaticMiddleware(
    req, res, next,
  ) {
    const url = cleanUrl(req.url)
    if (url.includes('.svg')) {
      if (url.split('/').length > 2) {
        const type = req.query.type
        if (type === 'static') {
          serveRoot(req, res, next)
        }
        else {
          const code = `export default '.${url}?type=static'`
          send(req, res, code, 'js', {})
        }
      }
      else {
        servePublic(req, res, next)
      }
    }

    else { next() }
  }
}
