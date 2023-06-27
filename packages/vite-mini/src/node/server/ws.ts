import type { Server } from 'node:http'
import type { Socket } from 'node:net'
import { WebSocketServer as WebSocketServerRaw } from 'ws'

export {
  WebSocketServerRaw,
}

export const HMR_HEADER = 'vitem-hmr'

export function createwebSocketServer(
  server: Server,
) {
  const wss = new WebSocketServerRaw({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    if (req.headers['sec-websocket-protocol'] === HMR_HEADER) {
      wss.handleUpgrade(req, socket as Socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    }
  })

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'connected' }))
    socket.on('message', (raw) => {
      console.log(JSON.parse(raw.toString()))
    })
  })

  return wss
}
