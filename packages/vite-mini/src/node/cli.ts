import cac from 'cac'
import colors from 'picocolors'
import { createLogger } from './logger'

const cli = cac('vmini')
// dev
cli
  .command('[root]', 'start dev server')
  .alias('server') // vite server
  .alias('dev') // vite dev
  .option('-d, --debug [feat]', '[string | boolean] show debug logs')
  .option('--port <port>', '[number] specify port')
  .action(async (root: string, options) => {
    const { createServer } = await import('./server')

    try {
      const server = await createServer({
        root,
        base: options.base,
        // mode: options.mode,
        // configFile: options.config,
        // logLevel: options.logLevel,
        // clearScreen: options.clearScreen,
        // optimizeDeps: { force: options.force },
        // server: cleanOptions(options),
      })

      if (!server.httpServer)
        throw new Error('HTTP server not available')

      await server.listen()

      server.printUrls()
    }
    catch (error) {
      const logger = createLogger(options.logLevel)
      logger.error(colors.red(`error when starting dev server:\n${error.stack}`), {
        error,
      })
      process.exit(1)
    }
  })

cli.help()
// cli.version(VERSION)

cli.parse()
