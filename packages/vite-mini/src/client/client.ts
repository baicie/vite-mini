/* eslint-disable no-case-declarations */
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

type PlayLoad = ConnectedPayload | ConnectedPayloadUpdate | ConnectedPayloadReload

export interface ConnectedPayload {
  type: 'connected'
}

export interface ConnectedPayloadUpdate {
  type: 'update'
  fileType: 'css' | 'vue'
  data: string
}

export interface ConnectedPayloadReload {
  type: 'reload'
}

const content = new Map<string, {
  value: string
  callback?: (mod: any) => void
}>()

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
      const modeule = await import(payload.data)
      switch (payload.fileType) {
        case 'css':
          break
        case 'vue':
          const con = content.get(payload.data)
          console.log(JSON.stringify(modeule))
          con?.callback?.(modeule)
          break
      }
      break
    case 'reload':
      window.location.reload()
      break
  }
}

// 收集
export function createHRMContext(path: string) {
  if (content.get(path))
    return

  return {
    update(callback: (mod: any) => void) {
      content.set(path, { value: path, callback })
    },
  }
}

// const _hot_context = createHRMContext('')

// _hot_context?.update((mod) => {
//   console.log(mod)
// })
