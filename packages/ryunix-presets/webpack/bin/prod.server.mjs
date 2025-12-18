import http from 'http'
import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import zlib from 'zlib'
import { promisify } from 'util'
import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import config from '../utils/config.cjs'

const gzip = promisify(zlib.gzip)
const brotliCompress = promisify(zlib.brotliCompress)

// MIME types dictionary
const MIME_TYPES = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar',
  '.7z': 'application/x-7z-compressed',
  '.rar': 'application/x-rar-compressed',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.ogv': 'video/ogg',
  '.m4v': 'video/mp4',
  '.3gp': 'video/3gpp',
  '.3g2': 'video/3gpp2',
  '.mkv': 'video/x-matroska',
  '.ts': 'video/mp2t',
}

// File cache for production server
const fileCache = new Map()
const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
let currentCacheSize = 0

/**
 * Get MIME type from file extension
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

/**
 * Validate path to prevent directory traversal attacks
 */
const validatePath = (requestPath, rootDir) => {
  try {
    const normalizedPath = path.normalize(requestPath)
    const resolvedPath = path.resolve(rootDir, normalizedPath.slice(1))

    if (!resolvedPath.startsWith(rootDir)) {
      return null
    }

    return resolvedPath
  } catch {
    return null
  }
}

/**
 * Generate ETag from file content
 */
const generateETag = (content) => {
  return createHash('md5').update(content).digest('hex')
}

/**
 * Check compression support (Brotli preferred over Gzip)
 */
const getAcceptedEncoding = (headers) => {
  const encoding = headers['accept-encoding'] || ''
  if (encoding.includes('br')) return 'br'
  if (encoding.includes('gzip')) return 'gzip'
  return null
}

/**
 * Check if MIME type is compressible
 */
const isCompressible = (mimeType) => {
  return (
    mimeType.startsWith('text/') ||
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('css')
  )
}

/**
 * Parse Range header
 */
const parseRange = (rangeHeader, fileSize) => {
  if (!rangeHeader) return null

  const parts = rangeHeader.replace(/bytes=/, '').split('-')
  const start = parseInt(parts[0], 10)
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

  if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
    return null
  }

  return { start, end, length: end - start + 1 }
}

/**
 * Check if file should support range requests (media files)
 */
const supportsRangeRequests = (mimeType) => {
  return (
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf'
  )
}

/**
 * Serve file with range support (for video/audio)
 */
const serveWithRange = async (filePath, req, res, stats) => {
  const mimeType = getMimeType(filePath)
  const range = parseRange(req.headers.range, stats.size)

  const headers = {
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000',
  }

  if (range) {
    // Partial content
    headers['Content-Range'] = `bytes ${range.start}-${range.end}/${stats.size}`
    headers['Content-Length'] = range.length

    res.writeHead(206, headers)

    const stream = createReadStream(filePath, {
      start: range.start,
      end: range.end,
    })
    await pipeline(stream, res)
  } else {
    // Full content
    headers['Content-Length'] = stats.size
    res.writeHead(200, headers)

    const stream = createReadStream(filePath)
    await pipeline(stream, res)
  }

  return true
}

/**
 * Serve static file with caching and compression
 */
const serveStaticFile = async (filePath, req, res) => {
  try {
    let stats = await fs.stat(filePath)

    // 👉 If is a directory
    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html')
      await fs.access(indexPath)
      stats = await fs.stat(indexPath)
      filePath = indexPath
    }

    const mimeType = getMimeType(filePath)

    // Use range requests for media files or large files
    if (supportsRangeRequests(mimeType) || stats.size > 5 * 1024 * 1024) {
      return await serveWithRange(filePath, req, res, stats)
    }

    let cached = fileCache.get(filePath)

    if (!cached) {
      // Read and cache file
      const content = await fs.readFile(filePath)
      const etag = generateETag(content)

      // Compress if text-based content
      let brotli = null
      let gzipped = null

      if (isCompressible(mimeType)) {
        try {
          ;[brotli, gzipped] = await Promise.all([
            brotliCompress(content, {
              params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
              },
            }),
            gzip(content),
          ])
        } catch {
          // Compression failed, serve uncompressed
        }
      }

      cached = {
        content,
        brotli,
        gzipped,
        etag,
        mimeType,
        size: stats.size,
      }

      // Update cache
      if (currentCacheSize + stats.size < MAX_CACHE_SIZE) {
        fileCache.set(filePath, cached)
        currentCacheSize += stats.size
      }
    }

    // Check ETag for 304 Not Modified
    if (req.headers['if-none-match'] === cached.etag) {
      res.writeHead(304)
      res.end()
      return true
    }

    // Select best encoding
    const encoding = getAcceptedEncoding(req.headers)
    let responseContent = cached.content
    let contentEncoding = null

    if (encoding === 'br' && cached.brotli) {
      responseContent = cached.brotli
      contentEncoding = 'br'
    } else if (encoding === 'gzip' && cached.gzipped) {
      responseContent = cached.gzipped
      contentEncoding = 'gzip'
    }

    const headers = {
      'Content-Type': cached.mimeType,
      'Content-Length': responseContent.length,
      ETag: cached.etag,
      'Cache-Control': 'public, max-age=31536000',
    }

    if (contentEncoding) {
      headers['Content-Encoding'] = contentEncoding
    }

    res.writeHead(200, headers)
    res.end(responseContent)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Serve HTML page with SPA fallback support
 */
const serveHTMLPage = async (pathname, staticDir, req, res) => {
  try {
    const candidates = []

    // / → /index.html
    if (pathname === '/') {
      candidates.push(path.join(staticDir, 'index.html'))
    } else {
      // /test → /test/index.html
      candidates.push(path.join(staticDir, pathname, 'index.html'))

      // /test → /test.html
      candidates.push(path.join(staticDir, `${pathname}.html`))

      // SPA fallback
      candidates.push(path.join(staticDir, 'index.html'))
    }

    let pageFile = null

    for (const file of candidates) {
      try {
        await fs.access(file)
        pageFile = file
        break
      } catch {}
    }

    if (!pageFile) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('404')
      return
    }

    const content = await fs.readFile(pageFile, 'utf-8')
    const etag = generateETag(Buffer.from(content))

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304)
      res.end()
      return
    }

    // Compress HTML
    let responseContent = content
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      ETag: etag,
      'Cache-Control': 'no-cache',
    }

    const encoding = getAcceptedEncoding(req.headers)

    if (encoding === 'br') {
      try {
        responseContent = await brotliCompress(Buffer.from(content))
        headers['Content-Encoding'] = 'br'
      } catch {
        // Fallback to uncompressed
      }
    } else if (encoding === 'gzip') {
      try {
        responseContent = await gzip(Buffer.from(content))
        headers['Content-Encoding'] = 'gzip'
      } catch {
        // Fallback to uncompressed
      }
    }

    headers['Content-Length'] = Buffer.byteLength(responseContent)

    res.writeHead(200, headers)
    res.end(responseContent)
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('500')
  }
}

/**
 * Request handler
 */
const requestHandler = async (req, res) => {
  const rootDir = process.cwd()
  const staticDir = path.join(
    rootDir,
    config.webpack.output.buildDirectory,
    'static',
  )

  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    const pathname = decodeURIComponent(parsedUrl.pathname)

    const safePath = validatePath(pathname, staticDir)
    if (!safePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('403')
      return
    }

    const fileServed = await serveStaticFile(safePath, req, res)

    if (!fileServed) {
      await serveHTMLPage(pathname, staticDir, req, res)
    }
  } catch (error) {
    console.error('[Ryunix Server Error]:', error.message)
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('500')
  }
}

const httpServ = http.createServer(requestHandler)

export default httpServ
