import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

/**
 * Parses url and extracts dynamic parameters like [id]
 */
function matchRoute(requestUrl, apiDirPath) {
  if (!fs.existsSync(apiDirPath)) return null

  const urlParts = requestUrl.split('?')[0].split('/').filter(Boolean)

  const findMatch = (currentDir, currentUrlParts, params) => {
    if (currentUrlParts.length === 0) {
      // Look for route.mjs or router.mjs
      for (const name of ['route.js', 'router.js']) {
        const filePath = path.join(currentDir, name)
        if (fs.existsSync(filePath)) {
          return { filePath, params }
        }
      }
      return null
    }

    const currentPart = currentUrlParts[0]
    const restParts = currentUrlParts.slice(1)

    // Directory doesn't exist? Could happen if catch-all matches
    if (!fs.existsSync(currentDir)) return null

    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    // Exact match first
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name === currentPart) {
        const match = findMatch(path.join(currentDir, entry.name), restParts, {
          ...params,
        })
        if (match) return match
      }
    }

    // Dynamic match like [id]
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        entry.name.startsWith('[') &&
        entry.name.endsWith(']') &&
        !entry.name.startsWith('[...')
      ) {
        const paramName = entry.name.slice(1, -1)
        const match = findMatch(path.join(currentDir, entry.name), restParts, {
          ...params,
          [paramName]: currentPart,
        })
        if (match) return match
      }
    }

    // Dynamic catch-all like [...slug]
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        entry.name.startsWith('[...') &&
        entry.name.endsWith(']')
      ) {
        const paramName = entry.name.slice(4, -1)
        for (const name of ['route.js', 'router.js']) {
          const filePath = path.join(currentDir, entry.name, name)
          if (fs.existsSync(filePath)) {
            return {
              filePath,
              params: { ...params, [paramName]: currentUrlParts },
            }
          }
        }
      }
    }

    return null
  }

  return findMatch(apiDirPath, urlParts, {})
}

export async function handleApiRequest(req, res, apiRootPath) {
  let parsedUrl
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  } catch (e) {
    res.writeHead(400)
    res.end('Bad Request')
    return true
  }

  const pathname = parsedUrl.pathname
  if (!pathname.startsWith('/api')) {
    return false // Not an API request
  }

  const apiPath = pathname.replace(/^\/api/, '')
  const match = matchRoute(apiPath, apiRootPath)

  if (!match) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not Found' }))
    return true
  }

  try {
    const fileUrl = pathToFileURL(match.filePath).href
    // Add cache busting in dev to hot-reload routes
    const importUrl =
      process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
        ? `${fileUrl}?update=${Date.now()}`
        : fileUrl

    const module = await import(importUrl)

    const method = req.method.toUpperCase()

    if (module[method]) {
      req.params = match.params
      req.query = Object.fromEntries(parsedUrl.searchParams.entries())

      // Wait for execution
      const result = await module[method](req, res)

      if (result instanceof Response) {
        const headers = {}
        result.headers.forEach((value, key) => {
          headers[key] = value
        })

        if (!res.headersSent) {
          res.writeHead(result.status || 200, headers)
        }

        if (result.body) {
          const buffer = await result.arrayBuffer()
          if (!res.writableEnded) res.end(Buffer.from(buffer))
        } else {
          if (!res.writableEnded) res.end()
        }
      } else if (result !== undefined && !res.headersSent) {
        const isObject = typeof result === 'object' && result !== null
        res.writeHead(200, {
          'Content-Type': isObject ? 'application/json' : 'text/plain',
        })
        res.end(isObject ? JSON.stringify(result) : String(result))
      }

      return true
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Method Not Allowed' }))
      return true
    }
  } catch (err) {
    console.error(`[API Error]:`, err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: 'Internal Server Error',
          details: err.message,
        }),
      )
    }
    return true
  }
}
