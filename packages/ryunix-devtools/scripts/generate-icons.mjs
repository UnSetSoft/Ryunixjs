import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'icons')

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return ~c >>> 0
}

function chunkWithCrc(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([length, typeBuf, data, crc])
}

/** Minimal solid-color PNG writer (no external deps). */
function createSolidPng(size, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const row = Buffer.alloc(1 + size * 3)
  row[0] = 0
  for (let x = 0; x < size; x++) {
    const offset = 1 + x * 3
    row[offset] = r
    row[offset + 1] = g
    row[offset + 2] = b
  }

  const raw = Buffer.concat(Array.from({ length: size }, () => row))
  const compressed = deflateSync(raw)

  return Buffer.concat([
    signature,
    chunkWithCrc('IHDR', ihdr),
    chunkWithCrc('IDAT', compressed),
    chunkWithCrc('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(iconsDir, { recursive: true })

for (const size of [16, 48, 128]) {
  writeFileSync(
    join(iconsDir, `icon-${size}.png`),
    createSolidPng(size, 37, 99, 235),
  )
}

console.log(
  '[ryunix-devtools] Generated icons/icon-16.png, icon-48.png, icon-128.png',
)
