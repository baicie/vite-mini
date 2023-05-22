import { consola } from 'consola'
import cac from 'cac'
import { createServer } from './server'

const cli = cac('vmini')
// dev
cli
  .command('[root]', 'start dev server')
  .alias('server') // vite server
  .alias('dev') // vite dev
  .option('--port <port>', '[number] specify port')
  .action(async (root: string, options) => {
    consola.warn(root, options)
    createServer(options)
  })
cli.help()
// cli.version(VERSION)

cli.parse()
