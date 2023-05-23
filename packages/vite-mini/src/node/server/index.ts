import type * as http from 'node:http'
import connect from 'connect'
import { consola } from 'consola'
import type { CommonServerOptions } from '../http'
import { httpServerStart, resolveHttpServer } from '../http'

import { DEFAULT_DEV_PORT } from '../constants'
import { resolveHostname, resolveServerUrls } from '../utils'
import type { Logger } from '../logger'
import { createLogger, printServerUrls } from '../logger'
import { indexHtmlMiddleware } from './middlewares/base'

interface InlineConfig {

}

export interface ViteDevServer {
  resolvedUrls: ResolvedServerUrls | null
  config: {
    root: string
    server: CommonServerOptions
    logger: Logger
  }
  httpServer: http.Server | null
  listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>
  printUrls(): void
  transformIndexHtml(
    url: string,
    html: string,
    originalUrl?: string,
  ): Promise<string>
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
  const middlewares = connect()
  // https options
  const httpServer = await resolveHttpServer(middlewares)

  const server: ViteDevServer = {
    httpServer,
    config: {
      server: {
        strictPort: false,
      },
      root: '/',
      logger: createLogger(),
    },
    async listen(port?: number, isRestart?: boolean) {
      // 启动服务
      consola.success('启动服务')
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
  middlewares.use(indexHtmlMiddleware(server))

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
