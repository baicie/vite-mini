import { STATUS_CODES, createServer as createHttpServer } from 'node:http'
import type { Server } from 'node:http'
import type { Socket } from 'node:net'
import { WebSocketServer as WebSocketServerRaw } from 'ws'

export {
  WebSocketServerRaw,
}

export const HMR_HEADER = 'vite-hmr'

export function createwebSocketServer(
  server: Server,
) {
  let wss: WebSocketServerRaw
  let wsHttpServer: Server | undefined
  const wsServer = server
  const port = 24679

  if (server) {
    wss = new WebSocketServerRaw({ noServer: true })
    server.on('upgrade', (req, socket, head) => {
      console.log('upgrade')
      if (req.headers['sec-websocket-protocol'] === HMR_HEADER) {
        wss.handleUpgrade(req, socket as Socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      }
    })
  }
  else {
    const route = ((_, res) => {
      const statusCode = 426
      const body = STATUS_CODES[statusCode]
      if (!body)
        throw new Error(`No body text found for the ${statusCode} status code`)

      res.writeHead(statusCode, {
        'Content-Length': body.length,
        'Content-Type': 'text/plain',
      })
      res.end(body)
    }) as Parameters<typeof createHttpServer>[1]

    wsHttpServer = createHttpServer(route)
    wss = new WebSocketServerRaw({ server: wsHttpServer })
  }

  wss.on('connection', (scoket) => {
    console.log('connection')
  })

  return {
    listen: () => {
      wsHttpServer?.listen(port, undefined)
    },
  }
}
