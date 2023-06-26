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
  const socket = new WebSocket(`ws://172.0.0.1:${post}/`, 'vite-hmr')
  let isOpen = false

  socket.addEventListener('open', () => {
    console.log('open')
    isOpen = true
  }, { once: true })

  socket.addEventListener('message', async ({ data }) => {
    console.log('close')
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

interface PlayLoad {

}

function handleMessage(payload: PlayLoad) {
  console.log('handleMessage', payload)
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
