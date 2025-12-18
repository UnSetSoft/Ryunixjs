/**
 * SSG Utilities - Static Site Generation
 * Provides utilities for generating static sites, sitemaps, and robots.txt
 */

import fs from 'fs'
import path from 'path'

/**
 * Extract valid routes for SSG from routes configuration
 * Filters out dynamic routes and special routes
 *
 * @param {Array} routes - Array of route objects
 * @returns {Array} - Array of valid SSG routes
 */
const extractSSGRoutes = (routes) => {
  const ssgRoutes = []

  const processRoute = (route, parentPath = '') => {
    // Skip invalid routes
    if (!route.path || route.path.includes(':')) return
    if (route.NotFound || route.noRenderLink) return

    const fullPath = parentPath + route.path
    const normalizedPath = fullPath === '' ? '/' : fullPath

    ssgRoutes.push({
      path: normalizedPath,
      component: route.component,
      meta: route.meta || {},
      sitemap: route.sitemap || {},
      label: route.label,
    })

    // Process nested routes recursively
    if (Array.isArray(route.subRoutes)) {
      route.subRoutes.forEach((subRoute) => {
        processRoute(subRoute, fullPath)
      })
    }
  }

  routes.forEach((route) => processRoute(route))
  return ssgRoutes
}

/**
 * Generate robots.txt content
 *
 * @param {string} baseURL - Base URL of the site
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.disallow - Paths to disallow
 * @param {Array<string>} options.allow - Paths to allow
 * @param {Array<string>} options.userAgents - User agents to target
 * @returns {string} - robots.txt content
 */
const generateRobotsTxt = (baseURL, options = {}) => {
  const { disallow = [], allow = [], userAgents = ['*'] } = options

  const lines = []

  userAgents.forEach((agent) => {
    lines.push(`User-agent: ${agent}`)
    allow.forEach((p) => lines.push(`Allow: ${p}`))
    disallow.forEach((p) => lines.push(`Disallow: ${p}`))
    lines.push('') // Empty line between user agents
  })

  lines.push(`Sitemap: ${baseURL}/sitemap.xml`)

  return lines.join('\n')
}

/**
 * Generate XML sitemap with all routes
 *
 * @param {Array} routes - Array of route objects
 * @param {string} baseURL - Base URL of the site
 * @param {Object} defaultSettings - Default sitemap settings
 * @param {string} defaultSettings.changefreq - Default change frequency
 * @param {string} defaultSettings.priority - Default priority
 * @returns {string} - Sitemap XML content
 */
const generateSitemap = (routes, baseURL, defaultSettings = {}) => {
  const { changefreq = 'weekly', priority = '0.7' } = defaultSettings

  const urls = routes
    .map((route) => {
      const url = `${baseURL}${route.path === '/' ? '' : route.path}`
      const meta = route.meta || {}
      const sitemap = route.sitemap || {}

      // Get metadata with fallbacks
      const lastmod =
        meta.lastmod ||
        sitemap.lastmod ||
        new Date().toISOString().split('T')[0]
      const freq = sitemap.changefreq || meta.changefreq || changefreq
      const prio = sitemap.priority || meta.priority || priority

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

/**
 * Generate HTML meta tags from metadata object
 *
 * @param {Object} meta - Metadata object
 * @param {Object} defaultMeta - Default metadata
 * @returns {string} - HTML meta tags
 */
const generateMetaTags = (meta, defaultMeta = {}) => {
  const tags = { ...defaultMeta, ...meta }
  const lines = []

  // Order of meta tags for better SEO
  const orderedKeys = [
    'description',
    'keywords',
    'author',
    'robots',
    'viewport',
    'og:title',
    'og:description',
    'og:image',
    'og:url',
    'og:type',
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image',
  ]

  // Function to add a meta tag
  const addMetaTag = (key, value) => {
    if (!value || ['title', 'canonical'].includes(key)) return

    const isProperty = key.startsWith('og:') || key.startsWith('twitter:')
    const attr = isProperty ? 'property' : 'name'

    // Handle arrays (e.g., keywords)
    if (Array.isArray(value)) {
      const content = value.join(', ')
      if (content) {
        lines.push(`<meta ${attr}="${key}" content="${content}" />`)
      }
    } else if (value) {
      // Escape quotes in content
      const escapedValue = String(value).replace(/"/g, '&quot;')
      lines.push(`<meta ${attr}="${key}" content="${escapedValue}" />`)
    }
  }

  // Add ordered meta tags first
  orderedKeys.forEach((key) => {
    if (key in tags) {
      addMetaTag(key, tags[key])
    }
  })

  // Add remaining meta tags
  Object.entries(tags).forEach(([key, value]) => {
    if (!orderedKeys.includes(key)) {
      addMetaTag(key, value)
    }
  })

  return lines.length > 0 ? '    ' + lines.join('\n    ') : ''
}

/**
 * Prerender a route to static HTML
 *
 * @param {Object} route - Route object
 * @param {string} template - HTML template
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} - Prerendered HTML
 */
const prerenderRoute = async (route, template, config) => {
  const meta = route.meta || {}
  const defaultMeta = config.static.seo.meta || {}
  let html = template

  // Replace title - use route meta or default
  const pageTitle = meta.title || defaultMeta.title || 'Ryunix App'
  html = html.replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`)

  // Generate and add meta tags
  const metaTags = generateMetaTags(meta, defaultMeta)

  // Remove existing meta tags (except framework/mode) and duplicate favicon
  // Remove all meta tags except framework and mode
  html = html.replace(/<meta\s+name="(?!framework|mode)[^"]*"[^>]*>/gi, '')
  html = html.replace(/<meta\s+property="[^"]*"[^>]*>/gi, '')

  // Remove duplicate favicon links (keep only first one)
  const faviconMatches = html.match(/<link\s+rel="icon"[^>]*>/gi)
  if (faviconMatches && faviconMatches.length > 1) {
    // Keep first, remove rest
    let firstFound = false
    html = html.replace(/<link\s+rel="icon"[^>]*>/gi, (match) => {
      if (!firstFound) {
        firstFound = true
        return match
      }
      return ''
    })
  }

  // Find the position to insert meta tags (after viewport or charset)
  const viewportPosition = html.search(/<meta\s+name="viewport"/)
  const charsetPosition = html.search(/<meta\s+charset/)
  let insertPosition = -1

  if (viewportPosition !== -1) {
    // Find end of viewport tag
    const afterViewport = html.substring(viewportPosition)
    const tagEnd = afterViewport.search(/>/)
    insertPosition = viewportPosition + tagEnd + 1
  } else if (charsetPosition !== -1) {
    // Find end of charset tag
    const afterCharset = html.substring(charsetPosition)
    const tagEnd = afterCharset.search(/>/)
    insertPosition = charsetPosition + tagEnd + 1
  }

  if (insertPosition !== -1 && metaTags) {
    // Insert meta tags after viewport/charset
    const before = html.substring(0, insertPosition)
    const after = html.substring(insertPosition)
    html = before + '\n' + metaTags + after
  } else if (metaTags) {
    // Fallback: insert before framework meta tag or </head>
    const frameworkPosition = html.search(/<meta\s+name="framework"/)
    if (frameworkPosition !== -1) {
      const before = html.substring(0, frameworkPosition)
      const after = html.substring(frameworkPosition)
      html = before + metaTags + '\n' + after
    } else {
      html = html.replace(/<\/head>/, `${metaTags}\n</head>`)
    }
  }

  // Add canonical link if provided
  if (meta.canonical) {
    const canonical = `<link rel="canonical" href="${meta.canonical}" />`
    // Insert canonical after meta tags, before title
    const titlePosition = html.search(/<title/)
    if (titlePosition !== -1) {
      const before = html.substring(0, titlePosition)
      const after = html.substring(titlePosition)
      html = before + canonical + '\n' + after
    } else {
      html = html.replace(/<\/head>/, `${canonical}\n</head>`)
    }
  }

  // Clean up multiple empty lines and format
  html = html.replace(/\n\s*\n\s*\n+/g, '\n')
  html = html.replace(/>\n\n+</g, '>\n<')

  return html
}

/**
 * Full SSG build process
 * Generates prerendered HTML, sitemap, and robots.txt
 *
 * @param {Array} routesConfig - Routes configuration
 * @param {Object} config - Site configuration
 * @param {string} buildDir - Build output directory
 */
const buildSSG = async (routesConfig, config, buildDir) => {
  // Extract valid routes
  const routes = extractSSGRoutes(routesConfig)

  if (routes.length === 0) {
    return
  }

  // Verify template exists
  const templatePath = path.join(buildDir, 'static', 'index.html')

  if (!fs.existsSync(templatePath)) {
    console.error('[SSG] ❌ Template not found:', templatePath)
    return
  }

  const template = fs.readFileSync(templatePath, 'utf-8')
  const prerenderRoutes = []

  // Prerender each route
  for (const route of routes) {
    try {
      const html = await prerenderRoute(route, template, config)

      const outputDir =
        route.path === '/'
          ? path.join(buildDir, 'static')
          : path.join(buildDir, 'static', route.path)

      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      // Write prerendered HTML
      fs.writeFileSync(path.join(outputDir, 'index.html'), html)
      prerenderRoutes.push(route.path)
    } catch (error) {
      console.error(`[SSG] ❌ Error prerendering ${route.path}:`, error)
    }
  }

  // Log results
  console.log(`✅ Prerendered ${prerenderRoutes.length} routes:`)
  prerenderRoutes.forEach((r) => console.log(` - ${r}`))

  // Generate sitemap if enabled
  if (config.experimental?.ssg?.sitemap?.enable) {
    try {
      const baseURL = config.experimental.ssg.sitemap.baseURL

      if (!baseURL) {
        console.warn(
          '[SSG] ⚠️  baseURL not configured, skipping sitemap generation.',
        )
        return
      }

      // Generate sitemap
      const sitemap = generateSitemap(
        routes,
        baseURL,
        config.experimental.ssg.sitemap.settings,
      )
      fs.writeFileSync(path.join(buildDir, 'static', 'sitemap.xml'), sitemap)
      console.log('✅ Sitemap created')

      // Generate robots.txt
      const robots = generateRobotsTxt(
        baseURL,
        config.experimental?.ssg?.robots,
      )
      fs.writeFileSync(path.join(buildDir, 'static', 'robots.txt'), robots)
      console.log('✅ Robots.txt created')
    } catch (error) {
      console.error('[SSG] ❌ Error generating Sitemap/Robots:', error)
    }
  }
}

export {
  extractSSGRoutes,
  generateSitemap,
  generateRobotsTxt,
  generateMetaTags,
  prerenderRoute,
  buildSSG,
}
