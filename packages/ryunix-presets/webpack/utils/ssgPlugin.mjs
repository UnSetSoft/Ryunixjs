
import fs from 'fs'
import path from 'path'

class RyunixRoutesPlugin {
  constructor(options = {}) {
    this.routesPath = options.routesPath || 'src/pages/routes.ryx'
    this.outputPath = options.outputPath || '.ryunix/ssg/routes.json'
    this.frontmatterCache = new Map()
    this.debug = options.debug || false
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      'RyunixRoutesPlugin',
      (compilation, callback) => {
        // Skip in development mode
        if (compiler.options.mode !== 'production') {
          callback()
          return
        }

        const routesFile = path.resolve(process.cwd(), this.routesPath)

        if (!fs.existsSync(routesFile)) {
          console.log(
            '[SSG] No routes file found, skipping manifest generation.',
          )
          callback()
          return
        }

        try {
          const content = fs.readFileSync(routesFile, 'utf-8')

          // Extract frontmatter from MDX files
          this.extractFrontmatter(content, path.dirname(routesFile))

          // Parse routes with evaluated expressions
          const routes = this.parseRoutes(content)
          console.log('✅ Extracted routes:')

          routes.map((route) => {
            console.log(`- ${route.path}`)
          })

          const manifest = JSON.stringify(routes, null, 2)
          const outputPath = path.resolve(process.cwd(), this.outputPath)

          fs.mkdirSync(path.dirname(outputPath), { recursive: true })
          fs.writeFileSync(outputPath, manifest)
          console.log('📦 SSG manifest saved:', routes.length, 'routes')
        } catch (error) {
          console.error('❌ Error generating routes manifest:', error)
        }

        callback()
      },
    )
  }

  /**
   * Extract frontmatter from MDX files referenced in imports
   */
  extractFrontmatter(content, baseDir) {
    // Match: import X, { frontmatter as Y } from "path.mdx"
    const importRegex =
      /import\s+\w+\s*,\s*{\s*frontmatter\s+as\s+(\w+)\s*}\s+from\s+["']([^"']+\.mdx)["']/g
    let match

    while ((match = importRegex.exec(content)) !== null) {
      const alias = match[1] // e.g., "TestPage"
      const mdxPath = match[2] // e.g., "./doc/content/Test.mdx"

      // Resolve absolute path
      const absolutePath = path.resolve(baseDir, mdxPath)

      if (this.debug) {
        console.log(`\n🔍 Processing: ${alias} from ${mdxPath}`)
        console.log(`   Absolute path: ${absolutePath}`)
      }

      if (!fs.existsSync(absolutePath)) {
        continue
      }

      try {
        // Read file
        let mdxContent = fs.readFileSync(absolutePath, 'utf-8')

        // Remove BOM if present
        if (mdxContent.charCodeAt(0) === 0xFEFF) {
          if (this.debug) {
            console.log('   🔧 Removing BOM from file')
          }
          mdxContent = mdxContent.slice(1)
        }

        const frontmatter = this.parseFrontmatter(mdxContent)

        if (Object.keys(frontmatter).length > 0) {
          this.frontmatterCache.set(alias, frontmatter)
          if (this.debug) {
            console.log(
              `✅ Loaded frontmatter: ${alias} from ${path.basename(absolutePath)}`,
            )
            console.log(`   Data:`, JSON.stringify(frontmatter, null, 2))
          }
        } else {
          console.warn(
            `⚠️  No frontmatter found in ${path.basename(absolutePath)}`,
          )
        }
      } catch (error) {
        console.error(`❌ Error reading ${absolutePath}:`, error.message)
      }
    }
  }

  /**
   * Parse YAML frontmatter from MDX content
   */
  parseFrontmatter(content) {
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1)
    }

    // Normalize line endings (CRLF -> LF)
    content = content.replace(/\r\n/g, '\n')

    // Try multiple regex patterns
    const patterns = [
      /^---\s*\n([\s\S]*?)\n---/,
      /^---\s*\n([\s\S]*?)\n\s*---/,
      /^\s*---\s*\n([\s\S]*?)\n\s*---\s*/,
    ]

    let yamlContent = null

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        yamlContent = match[1]
        break
      }
    }

    if (!yamlContent) {
      return {}
    }

    const frontmatter = {}

    // Split by lines
    const lines = yamlContent.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      // Match: key: value
      const keyValueMatch = line.match(/^\s*(\w+)\s*:\s*(.+)$/)
      if (!keyValueMatch) continue

      const key = keyValueMatch[1].trim()
      let value = keyValueMatch[2].trim()

      // Remove quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      // Parse arrays: [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        const items = value
          .slice(1, -1)
          .split(',')
          .map((item) => item.trim().replace(/["']/g, ''))
          .filter(Boolean)
        frontmatter[key] = items
        continue
      }

      // Parse booleans
      if (value === 'true') {
        frontmatter[key] = true
        continue
      }
      if (value === 'false') {
        frontmatter[key] = false
        continue
      }

      // Parse numbers
      if (!isNaN(value) && value !== '') {
        frontmatter[key] = Number(value)
        continue
      }

      // Default: string
      frontmatter[key] = value
    }

    return frontmatter
  }

  /**
   * Parse routes from content with expression evaluation
   */
  parseRoutes(content) {
    const routes = []
    const routeRegex = /\{\s*path:\s*["']([^"']+)["'][\s\S]*?\}/g
    let match

    while ((match = routeRegex.exec(content)) !== null) {
      const path = match[1]

      // Skip dynamic and special routes
      if (path.includes(':') || path === '*') continue

      const route = { path }

      // Get full route block
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

      // Extract fields with expression evaluation
      this.extractField(routeBlock, 'label', route)
      this.extractField(routeBlock, 'section', route)
      this.extractField(routeBlock, 'noRenderLink', route)

      // Extract meta object
      const metaMatch = routeBlock.match(/meta:\s*\{([\s\S]*?)\}(?:\s*[,}])/)
      if (metaMatch) {
        route.meta = {}
        this.extractField(metaMatch[1], 'title', route.meta)
        this.extractField(metaMatch[1], 'description', route.meta)
        this.extractField(metaMatch[1], 'keywords', route.meta)
        this.extractField(metaMatch[1], 'image', route.meta)
        this.extractField(metaMatch[1], 'author', route.meta)
      }

      routes.push(route)
    }

    return routes
  }

  /**
   * Extract and evaluate field from route block - FIXED
   * Now correctly handles array literals with brackets
   */
  extractField(block, fieldName, target) {
    // Find the field name
    const fieldStart = block.indexOf(`${fieldName}:`)
    if (fieldStart === -1) return

    // Start after "fieldName: "
    let valueStart = fieldStart + fieldName.length + 1
    while (block[valueStart] === ' ' || block[valueStart] === '\t') {
      valueStart++
    }

    // Extract value respecting brackets
    let expression = ''
    let bracketCount = 0
    let inQuotes = false
    let quoteChar = null

    for (let i = valueStart; i < block.length; i++) {
      const char = block[i]

      // Track quotes
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true
        quoteChar = char
        expression += char
        continue
      }

      if (char === quoteChar && inQuotes) {
        inQuotes = false
        quoteChar = null
        expression += char
        continue
      }

      // If in quotes, just add character
      if (inQuotes) {
        expression += char
        continue
      }

      // Track brackets
      if (char === '[') {
        bracketCount++
        expression += char
        continue
      }

      if (char === ']') {
        bracketCount--
        expression += char
        continue
      }

      // Stop at comma or closing brace if not inside brackets/quotes
      if ((char === ',' || char === '}') && bracketCount === 0) {
        break
      }

      expression += char
    }

    expression = expression.trim()

    // Remove trailing comma if present
    if (expression.endsWith(',')) {
      expression = expression.slice(0, -1).trim()
    }

    // Evaluate expression
    const value = this.evaluateExpression(expression)

    // Only add field if value is meaningful
    if (value !== undefined && value !== null && value !== '') {
      target[fieldName] = value
    }
  }

  /**
   * Evaluate expression with frontmatter data
   */
  evaluateExpression(expression) {
    // Match: Variable?.field || fallback
    const exprMatch = expression.match(/(\w+)\?\.(\w+)\s*\|\|\s*(.+)/)

    if (exprMatch) {
      const varName = exprMatch[1]
      const field = exprMatch[2]
      let fallback = exprMatch[3].trim()

      // Get frontmatter data
      const frontmatter = this.frontmatterCache.get(varName)

      // If frontmatter exists and has the field, return it
      if (frontmatter && frontmatter[field] !== undefined) {
        return frontmatter[field]
      }

      // Parse fallback value
      return this.parseLiteral(fallback)
    }

    // Direct value (no expression)
    return this.parseLiteral(expression)
  }

  /**
   * Parse literal value from string
   * Handles: strings, numbers, booleans, arrays (including with quotes)
   */
  parseLiteral(value) {
    value = value.trim()

    // Handle array literals: ["item1", "item2", "item3"]
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1).trim()

      // Empty array
      if (!arrayContent) {
        return []
      }

      // Parse items, handling quoted strings
      const items = []
      let currentItem = ''
      let inQuotes = false
      let quoteChar = null

      for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i]

        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (char === quoteChar && inQuotes) {
          inQuotes = false
          quoteChar = null
        } else if (char === ',' && !inQuotes) {
          items.push(currentItem.trim().replace(/^["']|["']$/g, ''))
          currentItem = ''
        } else {
          currentItem += char
        }
      }

      // Add last item
      if (currentItem.trim()) {
        items.push(currentItem.trim().replace(/^["']|["']$/g, ''))
      }

      return items.filter(Boolean)
    }

    // Remove quotes from strings
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1)
    }

    // Boolean
    if (value === 'true') return true
    if (value === 'false') return false

    // Number
    if (!isNaN(value) && value !== '') {
      return Number(value)
    }

    // String (unquoted)
    return value
  }
}

export default RyunixRoutesPlugin
