import type { Loader } from 'esbuild'
import esbuild from 'esbuild'
import type { ViteDevServer } from '../server'

// 转换资源 转换js
export async function transfromCode(
  id: string,
  code: string,
  config: ViteDevServer['config'],
) {
  if (id.endsWith('.vue')) {
    return code
  }
  else {
    let loader: Loader = 'ts'
    if (id.endsWith('.css'))
      loader = 'css'

    const res = await esbuild.transform(code, {
      loader,
      platform: 'browser',
      format: 'esm',
      logLevel: 'error',
      target: 'es2020',
      sourcemap: true,
      charset: 'utf8',
    })

    return res.code
  }
}
