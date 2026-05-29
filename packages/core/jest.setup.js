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

const { TextEncoder, TextDecoder } = require('node:util')
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream } = require('node:stream/web')
  global.ReadableStream = ReadableStream
}
