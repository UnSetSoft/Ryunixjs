import http from 'http'
import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import zlib from 'zlib'
import { promisify } from 'util'
import config from '../utils/config.cjs'

const gzip = promisify(zlib.gzip)

// MIME types dictionary (sin duplicados)
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
 * @param {string} filePath - File path
 * @returns {string} MIME type
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

/**
 * Validate path to prevent directory traversal attacks
 * @param {string} requestPath - Requested path
 * @param {string} rootDir - Root directory
 * @returns {string|null} Resolved safe path or null if unsafe
 */
const validatePath = (requestPath, rootDir) => {
  try {
    const normalizedPath = path.normalize(requestPath)
    const resolvedPath = path.resolve(rootDir, normalizedPath.slice(1))

    // Ensure the resolved path is within root directory
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
 * @param {Buffer} content - File content
 * @returns {string} ETag hash
 */
const generateETag = (content) => {
  return createHash('md5').update(content).digest('hex')
}

/**
 * Check if client supports gzip compression
 * @param {Object} headers - Request headers
 * @returns {boolean} True if gzip is supported
 */
const supportsGzip = (headers) => {
  const encoding = headers['accept-encoding'] || ''
  return encoding.includes('gzip')
}

/**
 * Serve static file with caching and compression
 * @param {string} filePath - Absolute file path
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 * @returns {Promise<boolean>} True if file was served
 */
const serveStaticFile = async (filePath, req, res) => {
  try {
    // Check cache first
    let cached = fileCache.get(filePath)

    if (!cached) {
      const stats = await fs.stat(filePath)

      // Don't cache very large files (>5MB)
      if (stats.size > 5 * 1024 * 1024) {
        const content = await fs.readFile(filePath)
        const mimeType = getMimeType(filePath)

        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': content.length,
        })
        res.end(content)
        return true
      }

      // Read and cache file
      const content = await fs.readFile(filePath)
      const etag = generateETag(content)

      // Compress if text-based content
      const mimeType = getMimeType(filePath)
      let compressed = null
      if (mimeType.startsWith('text/') ||
        mimeType.includes('javascript') ||
        mimeType.includes('json') ||
        mimeType.includes('css')) {
        try {
          compressed = await gzip(content)
        } catch {
          compressed = null
        }
      }

      cached = {
        content,
        compressed,
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

    // Serve compressed or regular content
    const useGzip = supportsGzip(req.headers) && cached.compressed
    const content = useGzip ? cached.compressed : cached.content

    const headers = {
      'Content-Type': cached.mimeType,
      'Content-Length': content.length,
      'ETag': cached.etag,
      'Cache-Control': 'public, max-age=31536000',
    }

    if (useGzip) {
      headers['Content-Encoding'] = 'gzip'
    }

    res.writeHead(200, headers)
    res.end(content)
    return true

  } catch (error) {
    // File doesn't exist or read error
    return false
  }
}

/**
 * Serve HTML page with SPA fallback support
 * @param {string} pathname - Request pathname
 * @param {string} staticDir - Static files directory
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 */
const serveHTMLPage = async (pathname, staticDir, req, res) => {
  try {
    // Normalize pathname
    let htmlPath = pathname === '/' ? '/index' : pathname
    let pageFile = path.join(staticDir, `${htmlPath}.html`)

    // Try direct path first
    try {
      await fs.access(pageFile)
    } catch {
      // Fallback to index.html for SPA routing
      pageFile = path.join(staticDir, 'index.html')

      try {
        await fs.access(pageFile)
      } catch {
        // No index.html found
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('404')
        return
      }
    }

    const content = await fs.readFile(pageFile, 'utf-8')
    const etag = generateETag(Buffer.from(content))

    // Check ETag
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304)
      res.end()
      return
    }

    // Compress HTML if supported
    let responseContent = content
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'ETag': etag,
      'Cache-Control': 'no-cache',
    }

    if (supportsGzip(req.headers)) {
      try {
        const compressed = await gzip(Buffer.from(content))
        responseContent = compressed
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
  const staticDir = path.join(rootDir, config.webpack.output.buildDirectory, 'static')

  try {
    // Parse URL
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    const pathname = decodeURIComponent(parsedUrl.pathname)

    // Validate path security
    const safePath = validatePath(pathname, staticDir)
    if (!safePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('403')
      return
    }

    // Try to serve as static file
    const fileServed = await serveStaticFile(safePath, req, res)

    if (!fileServed) {
      // Serve HTML page with SPA fallback
      await serveHTMLPage(pathname, staticDir, req, res)
    }

  } catch (error) {
    console.error('[Ryunix Server Error]:', error.message)
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('500')
  }
}

// Create HTTP server
const httpServ = http.createServer(requestHandler)

export default httpServ
