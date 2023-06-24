/* eslint-disable no-console */

console.debug('[vitem] connecting...')

declare const __SERVER_HOST__: number

const serverHost = __SERVER_HOST__

let websocket: WebSocket

try {
  // 失败时的回调
  const fallBack = () => {
    websocket = setupWebsocket(serverHost, fallBack)
  }
  websocket = setupWebsocket(serverHost, fallBack)
}
catch (error) {
  console.error(`[vitem] 启动失败：${error}`)
}

function setupWebsocket(post: number, fallBack: () => void) {
  console.debug(`[vitem] setup websocket with post:${post}`)
  const socket = new WebSocket(`ws://172.0.0.1:${post}`, 'vitem-hrm')
  let isOpen = false

  socket.addEventListener('open', () => {
    isOpen = true
  }, { once: true })

  socket.addEventListener('message', async ({ data }) => {
    handleMessage(JSON.parse(data))
  })

  socket.addEventListener('close', ({ wasClean }) => {
    if (wasClean)
      return

    if (!isOpen && fallBack)
      fallBack()

    location.reload()
  })

  return socket
}

interface PlayLoad {

}

function handleMessage(payload: PlayLoad) {
  console.log('handleMessage', payload)
}
