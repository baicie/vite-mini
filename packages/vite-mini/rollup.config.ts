// import { defineConfig } from 'rollup'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RollupOptions } from 'rollup'
import { defineConfig } from 'rollup'
import consola from 'consola'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function createNodeConfig() {
  return defineConfig({
    treeshake: true,
    output: {
      dir: './dist',
      entryFileNames: 'node/[name].js',
      chunkFileNames: 'node/chunks/dep-[hash].js',
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: true,
    },
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency'))
        return
      warn(warning)
    },
    input: {
      index: path.resolve(__dirname, 'src/node/index.ts'),
      cli: path.resolve(__dirname, 'src/node/cli.ts'),
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({
        tsconfig: path.resolve(__dirname, 'src/node/tsconfig.json'),
        sourceMap: true,
        declaration: true,
        declarationDir: './dist/node',
      }),
      commonjs({
        extensions: ['.js'],
        ignore: ['bufferutil', 'utf-8-validate'],
      }),
      json(),
    ],
  })
}

// 打印rollup参数
export default (commandL: any): RollupOptions[] => {
  consola.log(commandL)
  return defineConfig([
    createNodeConfig(),
  ])
}
