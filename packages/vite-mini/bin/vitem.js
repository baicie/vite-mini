function start() {
  return import('../dist/node/cli.js')
}

const debugIndex = process.argv.findIndex(arg => /^(?:-d|--debug)$/.test(arg))
if (debugIndex > 0) {
  const value = process.argv[debugIndex + 1]

  process.env.DEBUG = value
}
// 直接开始完事
start()
