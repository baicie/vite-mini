import type { Server as HttpServer } from 'node:http'
import type { ServerOptions as HttpsServerOptions } from 'node:https'
import type { Express } from 'express'

export interface CommonServerOptions {
  strictPort: boolean | undefined
  port?: number
  host?: string | boolean
  open?: boolean | string
}

export async function httpServerStart(
  httpServer: HttpServer,
  serverOptions: {
    port: number
    // 锁死？ 当填写port时锁死
    strictPort: boolean | undefined
    host: string | undefined
  },
) {
  return new Promise((resolve, reject) => {
    let { port, strictPort, host } = serverOptions
    const onError = (e: Error & { code?: string }) => {
      if (e.code === 'EADDRINUSE') {
        if (strictPort) {
          // 端口锁死
          httpServer.removeListener('error', onError)
          reject(new Error(`Port ${port} is already in use`))
        }
        else {
          // 没锁死 ++
          // logger.info(`Port ${port} is in use, trying another one...`)
          httpServer.listen(++port, host)
        }
      }
      else {
        httpServer.removeListener('error', onError)
        reject(e)
      }
    }

    httpServer.on('error', onError)
    // 如果有报错就执行onError回调
    httpServer.listen(port, host, () => {
      httpServer.removeListener('error', onError)
      // 没有报错就resolve端口
      resolve(port)
    })
  })
}

// 创建服务
export async function resolveHttpServer(
  app: Express,
  httpsOptions?: HttpsServerOptions,
): Promise<HttpServer> {
  const { createServer } = await import('node:http')
  return createServer(app)
}
