export const DEFAULT_PREVIEW_PORT = 4173

export const DEFAULT_DEV_PORT = 5173

export const loopbackHosts = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0000:0000:0000:0000:0000:0000:0000:0001',
])

export const FS_PREFIX = '/@fs/'

export const VITECACHE = '.vite-mini'

export const METADATA = '_metadata.json'

export const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/
export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/

export const INJECTION = '/@vite/client'
