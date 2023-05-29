import fs from 'node:fs'
import path from 'node:path'
import fsp from 'node:fs/promises'
import type { ViteDevServer } from '../index'
import { cleanUrl, normalizePath } from '../../utils'
import { FS_PREFIX } from '../../constants'
import { send } from '../send'
import type { NextHandleFunction } from './index-html'

export function indexHtmlMiddleware(
  server: ViteDevServer,
): NextHandleFunction {
  return async function viteIndexHtmlMiddleware(req, res, next) {
    console.log('index1')
    if (res.writableEnded)
      return next()

    const url = req.url && cleanUrl(req.url)
    console.log('index')
    if (url?.endsWith('.html') && req.headers['sec-fetch-dest'] !== 'script') {
      const filename = getHtmlFilename(url, server)
      if (fs.existsSync(filename)) {
        try {
          let html = await fsp.readFile(filename, 'utf-8')
          html = await server.transformIndexHtml(url, html, req.originalUrl)
          return send(req, res, html, 'html', {
            headers: server.config.server.headers,
          })
        }
        catch (e) {
          return next(e)
        }
      }
    }
    next()
  }
}

function getHtmlFilename(url: string, server: ViteDevServer) {
  if (url.startsWith(FS_PREFIX)) {
    // return decodeURIComponent(fsPathFromId(url))
    return url
  }
  else {
    return decodeURIComponent(
      normalizePath(path.join(server.config.root, url.slice(1))),
    )
  }
}
