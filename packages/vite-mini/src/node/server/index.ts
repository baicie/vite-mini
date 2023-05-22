import connect from 'connect'

interface InlineConfig {

}

interface ViteDevServer {}

export async function createServer(
  // 配置
  inlineConfig: InlineConfig = {},
): Promise<ViteDevServer> {
  return _createServer(inlineConfig, { ws: true })
}

// 创建服务
export async function _createServer(
  inlineConfig: InlineConfig = {},
  options: { ws: boolean },
): Promise<ViteDevServer> {
  // 加载vite.config.ts
  // const config = await resolveConfig(inlineConfig, 'serve')
  // 前面是各种配置文件
  const middlewares = connect()

  const server: ViteDevServer = {}
  middlewares.listen(3000)
  return server
}
