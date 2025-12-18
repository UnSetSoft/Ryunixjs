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
            '[SSG] No se encontró el archivo de rutas, omitiendo generación del manifiesto.',
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

          if (routes.length === 0) {
            console.warn(
              '[SSG] ⚠️  No valid routes were found for prerendering.',
            )
          }

          const manifest = JSON.stringify(routes, null, 2)
          const outputPath = path.resolve(process.cwd(), this.outputPath)

          fs.mkdirSync(path.dirname(outputPath), { recursive: true })
          fs.writeFileSync(outputPath, manifest)
        } catch (error) {
          console.error('[SSG] ❌ Error generating route manifest:', error)
        }

        callback()
      },
    )
  }

  /**
   * Extract frontmatter from MDX files referenced in imports
   * Matches: import X, { frontmatter as Y } from "path.mdx"
   * Supports multiline imports
   */
  extractFrontmatter(content, baseDir) {
    // Updated regex to support multiline imports
    const importRegex =
      /import\s+\w+\s*,\s*\{[\s\S]*?frontmatter\s+as\s+(\w+)[\s\S]*?\}\s+from\s+["']([^"']+\.mdx)["']/g
    let match

    while ((match = importRegex.exec(content)) !== null) {
      const alias = match[1] // e.g., "gettingStarted"
      const mdxPath = match[2] // e.g., "./doc/introduction/getting-started.mdx"

      // Resolve absolute path
      const absolutePath = path.resolve(baseDir, mdxPath)

      if (this.debug) {
        console.log(`\n🔍 Procesando: ${alias} desde ${mdxPath}`)
        console.log(`   Ruta absoluta: ${absolutePath}`)
      }

      if (!fs.existsSync(absolutePath)) {
        if (this.debug) {
          console.warn(`⚠️  Archivo no encontrado: ${absolutePath}`)
        }
        continue
      }

      try {
        // Read file
        let mdxContent = fs.readFileSync(absolutePath, 'utf-8')

        // Remove BOM if present
        if (mdxContent.charCodeAt(0) === 0xfeff) {
          if (this.debug) {
            console.log('   🔧 Removiendo BOM del archivo')
          }
          mdxContent = mdxContent.slice(1)
        }

        const frontmatter = this.parseFrontmatter(mdxContent)

        if (Object.keys(frontmatter).length > 0) {
          this.frontmatterCache.set(alias, frontmatter)
          if (this.debug) {
            console.log(
              `✅ Frontmatter cargado: ${alias} desde ${path.basename(absolutePath)}`,
            )
            console.log(`   Datos:`, JSON.stringify(frontmatter, null, 2))
          }
        } else {
          if (this.debug) {
            console.warn(
              `⚠️  No se encontró frontmatter en ${path.basename(absolutePath)}`,
            )
          }
        }
      } catch (error) {
        console.error(
          `❌ Error leyendo ${absolutePath}:`,
          error.message,
        )
      }
    }

    if (this.debug) {
      console.log(
        `\n📊 Total frontmatter cargados: ${this.frontmatterCache.size}`,
      )
    }
  }

  /**
   * Parse YAML frontmatter from MDX content
   * Handles multiple formats and edge cases
   */
  parseFrontmatter(content) {
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1)
    }

    // Normalize line endings (CRLF -> LF)
    content = content.replace(/\r\n/g, '\n')

    // Try multiple regex patterns for frontmatter
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
   * Handles: string literals, template literals, and fallback expressions
   */
  parseRoutes(content) {
    const routes = []

    // Match route objects - capture the entire object
    const routeRegex = /\{\s*path:\s*[`"'][^`"']*[`"'](?:\s*\|\|\s*[`"'][^`"']*[`"'])?\s*,[\s\S]*?\}/g
    let match

    while ((match = routeRegex.exec(content)) !== null) {
      const routeBlock = match[0]

      // Extract path expression (including template literals and fallbacks)
      const pathMatch = routeBlock.match(
        /path:\s*([`"'][^`"']*[`"'](?:\s*\|\|\s*[`"'][^`"']*[`"'])?)/,
      )

      if (!pathMatch) continue

      const pathExpression = pathMatch[1]

      // Evaluate the path expression
      const evaluatedPath = this.evaluatePathExpression(pathExpression)

      // Skip invalid paths
      if (!evaluatedPath) {
        if (this.debug) {
          console.log(`⏭️  Omitiendo ruta sin path válido`)
        }
        continue
      }

      // Skip dynamic routes and wildcards
      if (evaluatedPath.includes(':') || evaluatedPath === '*') {
        if (this.debug) {
          console.log(`⏭️  Omitiendo ruta dinámica/wildcard: ${evaluatedPath}`)
        }
        continue
      }

      // Check for noRenderLink early
      const noRenderLinkMatch = routeBlock.match(
        /noRenderLink:\s*([^,}\s]+)/,
      )
      if (noRenderLinkMatch) {
        const noRenderValue = this.evaluateExpression(
          noRenderLinkMatch[1].trim(),
        )
        if (noRenderValue === true) {
          if (this.debug) {
            console.log(`⏭️  Omitiendo ruta con noRenderLink: ${evaluatedPath}`)
          }
          continue
        }
      }

      // Check for NotFound property
      if (routeBlock.includes('NotFound:')) {
        if (this.debug) {
          console.log(`⏭️  Omitiendo ruta NotFound: ${evaluatedPath}`)
        }
        continue
      }

      const route = { path: evaluatedPath }

      // Extract fields with expression evaluation
      this.extractField(routeBlock, 'label', route)
      this.extractField(routeBlock, 'section', route)

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

      if (this.debug) {
        console.log(`✅ Ruta añadida: ${evaluatedPath}`)
      }
    }

    return routes
  }

  /**
   * Evaluate path expressions including template literals
   * Handles: `/docs/${variable.field}` || "/fallback"
   */
  evaluatePathExpression(expression) {
    // Handle fallback expressions: `...` || "..."
    const fallbackMatch = expression.match(
      /([`"'][^`"']*[`"'])\s*\|\|\s*([`"'][^`"']*[`"'])/,
    )

    if (fallbackMatch) {
      const primary = this.evaluateSinglePath(fallbackMatch[1])
      if (primary && !primary.includes('undefined')) {
        return primary
      }
      return this.evaluateSinglePath(fallbackMatch[2])
    }

    return this.evaluateSinglePath(expression)
  }

  /**
   * Evaluate a single path expression (template literal or string)
   */
  evaluateSinglePath(pathExpr) {
    // Remove surrounding quotes/backticks
    pathExpr = pathExpr.trim().replace(/^[`"']|[`"']$/g, '')

    // Match template literal expressions: ${variable.field}
    const templateRegex = /\$\{([^}]+)\}/g
    let result = pathExpr
    let match

    while ((match = templateRegex.exec(pathExpr)) !== null) {
      const expression = match[1].trim()
      const value = this.resolveExpression(expression)

      if (value !== undefined && value !== null) {
        result = result.replace(match[0], value)
      } else {
        // If can't resolve, return undefined to try fallback
        return undefined
      }
    }

    return result
  }

  /**
   * Resolve expression like "variable.field" or "variable?.field" using frontmatter cache
   * Handles optional chaining
   */
  resolveExpression(expression) {
    // Remove optional chaining operator if present
    expression = expression.replace(/\?\./, '.')

    const parts = expression.split('.')

    if (parts.length !== 2) {
      return undefined
    }

    const [varName, field] = parts
    const frontmatter = this.frontmatterCache.get(varName)

    if (!frontmatter || frontmatter[field] === undefined) {
      return undefined
    }

    return frontmatter[field]
  }

  /**
   * Extract and evaluate field from route block
   * Handles arrays, objects, and expressions with fallbacks
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

    // Extract value respecting brackets and braces
    let expression = ''
    let bracketCount = 0
    let braceCount = 0
    let inQuotes = false
    let quoteChar = null

    for (let i = valueStart; i < block.length; i++) {
      const char = block[i]

      // Track quotes
      if ((char === '"' || char === "'" || char === '`') && !inQuotes) {
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

      // Track brackets and braces
      if (char === '[') bracketCount++
      if (char === ']') bracketCount--
      if (char === '{') braceCount++
      if (char === '}') braceCount--

      // Stop at comma or closing brace if not inside brackets/braces/quotes
      if (
        (char === ',' || char === '}') &&
        bracketCount === 0 &&
        braceCount === 0
      ) {
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
   * Handles: variable?.field || fallback
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
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('`') && value.endsWith('`'))
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
