import type { Request, Response } from 'express'

export function send(
  req: Request,
  res: Response,
  content: string | Buffer,
  type: string,
  options: SendOptions,
): void {
  const {
    etag = getEtag(content, { weak: true }),
    cacheControl = 'no-cache',
    headers,
    map,
  } = options

  if (res.writableEnded)
    return

  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304
    res.end()
    return
  }

  res.setHeader('Content-Type', alias[type] || type)
  res.setHeader('Cache-Control', cacheControl)
  res.setHeader('Etag', etag)

  if (headers) {
    for (const name in headers)
      res.setHeader(name, headers[name]!)
  }

  // inject source map reference
  if (map && map.mappings) {
    if (type === 'js' || type === 'css')
      content = getCodeWithSourcemap(type, content.toString(), map)
  }

  res.statusCode = 200
  res.end(content)
}
