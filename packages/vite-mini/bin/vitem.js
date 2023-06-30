function start() {
  try {
    return import('../dist/node/cli.js')
  }
  catch (error) {
    console.error(error)
  }
}

const debugIndex = process.argv.findIndex(arg => /^(?:-d|--debug)$/.test(arg))
if (debugIndex > 0) {
  const value = process.argv[debugIndex + 1]

  process.env.DEBUG = 'vitem:*'
}
// 直接开始完事
start()
