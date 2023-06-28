/* eslint-disable no-console */

console.debug('[vitem] connecting...')

declare const __SERVER_HOST__: number

const serverHost = __SERVER_HOST__

let socket: WebSocket

try {
  // 失败时的回调
  const fallBack = () => {
    socket = setupWebsocket(serverHost, fallBack)
  }
  socket = setupWebsocket(serverHost, fallBack)
}
catch (error) {
  console.error(`[vitem] 启动失败：${error}`)
}

function setupWebsocket(post: number, fallBack: () => void) {
  console.debug(`[vitem] setup websocket with post:${post}`)
  const socket = new WebSocket(`ws://127.0.0.1:${post}/`, 'vitem-hmr')

  let isOpen = false

  socket.addEventListener('open', () => {
    isOpen = true
  }, { once: true })

  socket.addEventListener('message', async ({ data }) => {
    handleMessage(JSON.parse(data))
  })

  socket.addEventListener('close', async ({ wasClean }) => {
    if (wasClean)
      return

    if (!isOpen && fallBack) {
      fallBack()
      return
    }
    console.log('[vite] server connection lost. polling for restart...')
    location.reload()
  })

  return socket
}

type PlayLoad = ConnectedPayload | ConnectedPayloadUpdate

export interface ConnectedPayload {
  type: 'connected'
}

export interface ConnectedPayloadUpdate {
  type: 'update'
  data: string
}

async function handleMessage(payload: PlayLoad) {
  switch (payload.type) {
    case 'connected':
      console.log('[vitem] server connected')
      setInterval(() => {
        if (socket.readyState === socket.OPEN)
          socket.send('{"type":"ping"}')
      }, 50000)
      break
    case 'update':
      // eslint-disable-next-line no-case-declarations
      const modeule = await import(payload.data)
      console.log(modeule)
      break
  }
}
