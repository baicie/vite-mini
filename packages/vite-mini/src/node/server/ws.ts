/* eslint-disable prefer-const */
import { WebSocketServer as WebSocketServerRaw } from 'ws'

export {
  WebSocketServerRaw,
}

export function createwebSocketServer(
) {
  let wss: WebSocketServerRaw

  wss = new WebSocketServerRaw({ noServer: true })

  wss.on('connection', (scoket) => {
    scoket.on('message', (raw) => {
      console.log(`raw:${raw}`)
    })
  })

  return wss
}
