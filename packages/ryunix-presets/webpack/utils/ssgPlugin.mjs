/**
 * Webpack plugin to extract routes for SSG
 */
import fs from 'fs'
import path from 'path'

class RyunixRoutesPlugin {
  constructor(options = {}) {
    this.routesPath = options.routesPath || 'src/pages/routes.ryx'
    this.outputPath = options.outputPath || '.ryunix/ssg/routes.json'
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('RyunixRoutesPlugin', (compilation, callback) => {
      // Skip in development mode
      if (compiler.options.mode !== 'production') {
        callback()
        return
      }

      const routesFile = path.resolve(process.cwd(), this.routesPath)

      if (!fs.existsSync(routesFile)) {
        console.log('[SSG] No routes file found, skipping manifest generation.')
        callback()
        return
      }

      try {
        const content = fs.readFileSync(routesFile, 'utf-8')
        console.log('📄 Routes file size:', content.length, 'bytes')

        const routes = this.parseRoutes(content)
        console.log('✅ Extracted routes:', JSON.stringify(routes, null, 2))

        const manifest = JSON.stringify(routes, null, 2)
        const outputPath = path.resolve(process.cwd(), this.outputPath)

        fs.mkdirSync(path.dirname(outputPath), { recursive: true })
        fs.writeFileSync(outputPath, manifest)


      } catch (error) {
        console.error('❌ Error generating routes manifest:', error)
      }

      callback()
    })
  }

  parseRoutes(content) {
    const routes = []

    // Match route objects more loosely
    const routeRegex = /\{\s*path:\s*["']([^"']+)["'][\s\S]*?\}/g
    let match

    while ((match = routeRegex.exec(content)) !== null) {
      const path = match[1]

      // Skip dynamic and special routes
      if (path.includes(':') || path === '*') continue

      const route = { path }

      // Get full route block (find next closing brace at same level)
      const startIdx = match.index
      let braceCount = 1
      let endIdx = startIdx + 1

      for (let i = startIdx + 1; i < content.length; i++) {
        if (content[i] === '{') braceCount++
        if (content[i] === '}') braceCount--
        if (braceCount === 0) {
          endIdx = i
          break
        }
      }

      const routeBlock = content.substring(startIdx, endIdx + 1)

      // Extract meta with nested braces support
      const metaMatch = routeBlock.match(/meta:\s*\{([\s\S]*?)\}(?:\s*,|\s*\})/)
      if (metaMatch) {
        route.meta = this.parseObject(metaMatch[1])
      }

      // Extract sitemap
      const sitemapMatch = routeBlock.match(/sitemap:\s*\{([^}]+)\}/)
      if (sitemapMatch) {
        route.sitemap = this.parseObject(sitemapMatch[1])
      }

      routes.push(route)
    }

    return routes
  }

  parseObject(str) {
    const obj = {}
    const pairs = str.match(/["']?[\w:]+["']?\s*:\s*["'][^"']*["']/g) || []

    pairs.forEach(pair => {
      const [key, value] = pair.split(':').map(s => s.trim().replace(/["']/g, ''))
      obj[key] = value
    })

    return obj
  }
}

export default RyunixRoutesPlugin
