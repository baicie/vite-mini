import fs from 'node:fs'
import path from 'node:path'
import { init as importInit, parse as importParse } from 'es-module-lexer'
import type { NextFunction, Request, Response } from 'express'
import MagicStr from 'magic-string'
import { resolveId } from '../../plugins/resolve'
import { createDebugger } from '../../utils'
import type { ViteDevServer } from '../index'
import type { NextHandleFunction } from './index-html'

const debug = createDebugger('vitem:transfrom')

export function transfromMiddleware(
  server: ViteDevServer,
): NextHandleFunction {
  return async function vitemTransformMiddleware(
    req: Request, res: Response, next: NextFunction,
  ) {
    // 拿到最后返回结果
    const result = await resolveCodeAndTransForm(
      req.url,
      server.config,
    )
    next()
  }
}

async function resolveCodeAndTransForm(
  id: string,
  config: ViteDevServer['config'],
) {
  if (id === '/')
    return
  const sourceId = resolveId(
    id,
    config,
    '',
  )

  if (!fs.existsSync(sourceId))
    return
  // 拿到源码
  const code = fs.readFileSync(sourceId, { encoding: 'utf-8' })
  // const responseCode = await transfromCode(id, code, config)

  const res = await transfromImport(
    sourceId,
    code,
    config,
  )
}

// 转换import
async function transfromImport(
  id: string,
  source: string,
  config: ViteDevServer['config'],
) {
  await importInit
  // console.log('code', code, config)
  const magicstr = new MagicStr(source)
  console.log('magicstr1', magicstr.original)
  const [imports, exports] = importParse(source)
  imports.forEach((imp) => {
    if (imp.n) {
      const resId = resolveId(
        imp.n,
        config,
        id,
      )
      const newPath = path.relative(config.root, resId)
      console.log(newPath)
      // newPath = newPath.concat(source.slice(imp.e + 1))
      // source = source.slice(0, imp.s) + newPath
      // source.slice(imp.s, imp.e)
      magicstr.overwrite(imp.s, imp.e, newPath, { contentOnly: true })
    }
  })

  console.log('magicstr', magicstr.original)

  console.log('imports', imports)
}

// 源码逻辑备注
// 1.transformMiddleware
// 主要负责请求相关的东西
// 2.transformRequest
// 中间存在一个缓存 加载后处理完代码后统一返回？
// 3.doTransform
// 先执行resolveId获取当前请求对应文件位置 对应plugin resolve
// 4.loadAndTransform
// 使用load方法去加载源码 load中使用三方es-module-lexer 获取import export然后进行操作 对应plugin import-analysis
// 将操作后的文件返回
// 执行transform将文件转换为js  对应plugin esbuild
// 最后在返回code
