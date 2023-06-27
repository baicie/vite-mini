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
    console.log('open')
    isOpen = true
  }, { once: true })

  socket.addEventListener('message', async ({ data }) => {
    console.log('message')
    handleMessage(JSON.parse(data))
  })

  socket.addEventListener('close', async ({ wasClean }) => {
    console.log('close')
    if (wasClean)
      return

    if (!isOpen && fallBack) {
      fallBack()
      return
    }
    console.log('[vite] server connection lost. polling for restart...')
    await waitForSuccessfulPing(post)
    location.reload()
  })

  return socket
}

type PlayLoad = ConnectedPayload

export interface ConnectedPayload {
  type: 'connected'
}

function handleMessage(payload: PlayLoad) {
  switch (payload.type) {
    case 'connected':
      console.log('[vitem] server connected')
      setInterval(() => {
        if (socket.readyState === socket.OPEN)
          socket.send('{"type":"ping"}')
      }, 5000)
      break
  }
}

async function waitForSuccessfulPing(
  post: number,
  ms = 1000,
) {
  const ping = async () => {
    console.log('ping')
    try {
      await fetch(`ws://172.0.0.1:${post}`, {
        mode: 'no-cors',
        headers: {
          Accept: 'text/x-vite-ping',
        },
      })
      return true
    }
    catch (error) {}
    return false
  }

  if (await ping())
    return

  await wait(ms)

  while (true) {
    if (document.visibilityState === 'visible') {
      if (await ping())
        break

      await wait(ms)
    }
    else {
      await waitForWindowShow()
    }
  }
}

function waitForWindowShow() {
  return new Promise<void>((resolve) => {
    const onChange = async () => {
      if (document.visibilityState === 'visible') {
        resolve()
        document.removeEventListener('visibilitychange', onChange)
      }
    }
    document.addEventListener('visibilitychange', onChange)
  })
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
