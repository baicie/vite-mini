import type { SourceMap } from 'rollup'

export function genSourceMapUrl(map: SourceMap | string): string {
  if (typeof map !== 'string')
    map = JSON.stringify(map)

  // eslint-disable-next-line n/prefer-global/buffer
  return `data:application/json;base64,${Buffer.from(map).toString('base64')}`
}

export function getCodeWithSourcemap(
  type: 'js' | 'css',
  code: string,
  map: SourceMap,
): string {
  if (type === 'js')
    code += `\n//# sourceMappingURL=${genSourceMapUrl(map)}`

  else if (type === 'css')
    code += `\n/*# sourceMappingURL=${genSourceMapUrl(map)} */`

  return code
}
