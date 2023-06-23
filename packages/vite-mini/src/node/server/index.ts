import type * as http from 'node:http'
import path from 'node:path'
import express from 'express'
import type { CommonServerOptions } from '../http'
import { httpServerStart, resolveHttpServer } from '../http'

import { DEFAULT_DEV_PORT, VITECACHE } from '../constants'
import { normalizePath, resolveHostname, resolveServerUrls } from '../utils'
import type { Logger } from '../logger'
import { createLogger, printServerUrls } from '../logger'
import { createDepsOptimizer } from '../optimizer'
import { indexHtmlMiddleware } from './middlewares/index-html'
import { htmlFallBackMiddleware } from './middlewares/html-fallback'
import { transfromMiddleware } from './middlewares/transform'
import { servePublicMiddleware } from './middlewares/static'

interface InlineConfig {

}

export interface ViteDevServer {
  resolvedUrls: ResolvedServerUrls | null
  config: {
    root: string
    server: CommonServerOptions
    logger: Logger
    cacheDeps: Record<string, string>
    transformCaches: Record<string, {
      src: string
      file: string
      code?: string
    }>
    cacheDir: string
  }
  httpServer: http.Server | null
  listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>
  printUrls(): void
}

export interface ResolvedServerUrls {
  local: string[]
  network: string[]
}

export async function createServer(
  // 配置
  inlineConfig: InlineConfig = {},
): Promise<ViteDevServer> {
  return _createServer(inlineConfig, { ws: true })
}

// 创建服务
export async function _createServer(
  inlineConfig: InlineConfig = {},
  options: { ws: boolean },
): Promise<ViteDevServer> {
  // const { root, server: serverConfig } = config
  // 加载vite.config.ts
  // const config = await resolveConfig(inlineConfig, 'serve')
  // 前面是各种配置文件
  const app = express()
  // const app = connect()
  // https options
  const httpServer = await resolveHttpServer(app)

  const server: ViteDevServer = {
    httpServer,
    config: {
      server: {
        strictPort: false,
      },
      root: normalizePath(process.cwd()),
      logger: createLogger(),
      cacheDeps: {},
      transformCaches: {},
      cacheDir: path.join(normalizePath(process.cwd()), 'node_modules', VITECACHE, 'deps'),
    },
    async listen(port?: number, isRestart?: boolean) {
      //
      await createDepsOptimizer(server)
      // 启动服务
      await startServer(server, port)
      // 拼接url
      if (httpServer) {
        server.resolvedUrls = await resolveServerUrls(
          httpServer,
          server.config.server,
        )
      }
      return server
    },
    printUrls() {
      if (server.resolvedUrls) {
        printServerUrls(
          server.resolvedUrls,
          undefined,
          server.config.logger.info,
        )
      }
    },
    resolvedUrls: null,
  }

  // code
  app.use(transfromMiddleware(server))

  app.use(servePublicMiddleware(path.join(server.config.root, 'public')))
  app.use(servePublicMiddleware(path.join(server.config.root, '')))
  // index.html
  app.use(htmlFallBackMiddleware('/'))

  app.use(indexHtmlMiddleware(server))

  return server
}

// 服务启动函数
async function startServer(
  server: ViteDevServer,
  // 在命令行输入的port
  inlinePort?: number,
) {
  const httpServer = server.httpServer
  if (!httpServer)
    throw new Error('Cannot call server.listen in middleware mode.')

  const options = server.config.server
  const port = inlinePort ?? options.port ?? DEFAULT_DEV_PORT
  const hostname = await resolveHostname(options.host)

  await httpServerStart(httpServer, {
    port,
    strictPort: options.strictPort,
    host: hostname.host,
  })
}
