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
  const wsServer = server

  if (wsServer) {
    wss = new WebSocketServerRaw({ noServer: true })
    wsServer.on('upgrade', (req, socket, head) => {
      console.log('upgrade', wss.address(), wss.options)
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

    const wsHttpServer = createHttpServer(route)
    wss = new WebSocketServerRaw({ server: wsHttpServer })
  }

  wss.on('connection', (scoket) => {
    console.log('connection')
  })

  return wss
}
