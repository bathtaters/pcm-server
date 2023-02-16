module.exports = function onExit(handler) {
  let isExiting = false

  const exitHandler = (exit = false, hasError) => (err) => {
    if (hasError) console.error(err)
    if (isExiting) return hasError && process.exit()
    isExiting = true
    handler()
    if (exit) process.exit()
  }

  process.stdin.resume() // so the program will not close instantly

  const handlers = [exitHandler(true), exitHandler(true,true), exitHandler()]

  process.on('exit', handlers[2])
  process.on('SIGINT', handlers[0]) // ctrl+c event
  process.on('SIGUSR1', handlers[0]) // "kill pid"
  process.on('SIGUSR2', handlers[0]) // "kill pid"
  process.on('uncaughtException', handlers[1])

  return function removeListeners() {
    process.off('exit', handlers[2])
    process.off('SIGINT', handlers[0])
    process.off('SIGUSR1', handlers[0])
    process.off('SIGUSR2', handlers[0])
    process.off('uncaughtException', handlers[1])
  }
}