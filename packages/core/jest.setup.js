global.requestIdleCallback = (cb) => {
  return setTimeout(() => {
    cb({
      timeRemaining: () => 50,
    })
  }, 1)
}

global.cancelIdleCallback = (id) => {
  clearTimeout(id)
}
