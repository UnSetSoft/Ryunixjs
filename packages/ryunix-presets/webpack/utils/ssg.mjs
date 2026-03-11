/**
 * SSG Utilities - Static Site Generation
 * Provides utilities for generating static sites, sitemaps, and robots.txt
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { randomBytes } from 'crypto'

/**
 * Import a file as ES module — works for both .mjs and .js files.
 * For .js files with ESM syntax, creates a temp .mjs copy to avoid the
 * NODE_TYPELESS_PACKAGE_JSON warning and performance overhead.
 * The temp file is cleaned up automatically after import.
 */
const importEsmFile = async (filePath) => {
  if (filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) {
    return import(`file://${filePath}?update=${Date.now()}`)
  }
  // For .js: copy to a temp .mjs so Node.js treats it as ESM without warnings
  const tmpPath = path.join(os.tmpdir(), `ryunix-ssg-${randomBytes(8).toString('hex')}.mjs`)
  try {
    fs.copyFileSync(filePath, tmpPath)
    return await import(`file://${tmpPath}`)
  } finally {
    try { fs.unlinkSync(tmpPath) } catch { }
  }
}

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
/**
 * Generate robots.txt content
 *
 * Supports two formats:
 *
 * Legacy (ryunix.config.js):
 *   { userAgents: ['*'], allow: ['/'], disallow: ['/api/'] }
 *
 * Next.js-style (app/robots.js):
 *   { rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }], sitemap: 'https://...' }
 *
 * @param {string|null} baseURL
 * @param {Object} options
 */
const generateRobotsTxt = (baseURL, options = {}) => {
  const lines = []

  if (Array.isArray(options.rules)) {
    // Next.js-style: rules array
    for (const rule of options.rules) {
      const agents = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent || '*']
      agents.forEach((agent) => lines.push(`User-agent: ${agent}`))

      const allows = Array.isArray(rule.allow) ? rule.allow : (rule.allow ? [rule.allow] : [])
      const disallows = Array.isArray(rule.disallow) ? rule.disallow : (rule.disallow ? [rule.disallow] : [])
      allows.forEach((p) => lines.push(`Allow: ${p}`))
      disallows.forEach((p) => lines.push(`Disallow: ${p}`))
      lines.push('')
    }

    // Explicit sitemap URL overrides baseURL inference
    const sitemapUrl = options.sitemap || (baseURL ? `${baseURL}/sitemap.xml` : null)
    if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`)
  } else {
    // Legacy format
    const { disallow = [], allow = [], userAgents = ['*'] } = options
    userAgents.forEach((agent) => {
      lines.push(`User-agent: ${agent}`)
      allow.forEach((p) => lines.push(`Allow: ${p}`))
      disallow.forEach((p) => lines.push(`Disallow: ${p}`))
      lines.push('')
    })
    if (baseURL) lines.push(`Sitemap: ${baseURL}/sitemap.xml`)
  }

  return lines.join('\n')
}

/**
 * Generate XML sitemap from an array of route objects (config-based)
 * @param {Array} routes - Route objects from App Router
 * @param {string} baseURL
 * @param {Object} defaultSettings
 */
const generateSitemap = (routes, baseURL, defaultSettings = {}) => {
  const { changefreq = 'weekly', priority = '0.7' } = defaultSettings

  const urls = routes
    .map((route) => {
      const url = `${baseURL}${route.path === '/' ? '' : route.path}`
      const meta = route.meta || {}
      const sitemap = route.sitemap || {}

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
 * Generate XML sitemap from direct entries returned by sitemap.js
 * Each entry: { url, lastModified?, changefreq?, priority? }
 * @param {Array} entries
 */
const generateSitemapFromEntries = (entries) => {
  const urls = entries
    .map((entry) => {
      if (!entry.url) return ''
      const lastmod = entry.lastModified
        ? (entry.lastModified instanceof Date
          ? entry.lastModified.toISOString().split('T')[0]
          : String(entry.lastModified))
        : new Date().toISOString().split('T')[0]
      const freq = entry.changefreq || 'weekly'
      const prio = entry.priority != null ? String(entry.priority) : '0.7'

      return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`
    })
    .filter(Boolean)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

/**
 * Generate a sitemap index XML for multiple sitemaps
 * @param {string} baseURL
 * @param {number} count - number of indexed sitemap files
 */
const generateSitemapIndex = (baseURL, count) => {
  const sitemaps = Array.from({ length: count }, (_, i) =>
    `  <sitemap>
    <loc>${baseURL}/sitemap-${i}.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`
}

/**
 * Generate HTML meta tags from metadata object
 *
 * Internal Ryunix keys (titleTemplate, titleDefault, etc.) are never emitted
 * as <meta> tags. To add arbitrary meta tags use the `custom` key:
 *   export const Metatags = { title: 'Page', custom: { 'theme-color': '#fff' } }
 *
 * @param {Object} meta - Metadata object
 * @param {Object} defaultMeta - Default metadata
 * @returns {string} - HTML meta tags
 */
const generateMetaTags = (meta, defaultMeta = {}) => {
  const tags = { ...defaultMeta, ...meta }
  const lines = []

  // Keys that are handled separately (title tag, link tag) — never emit as <meta>
  const INTERNAL_KEYS = new Set([
    'title',
    'canonical',
    'titleTemplate',
    'titleDefault',
    'lastmod',
    'changefreq',
    'priority',
    'custom',
  ])

  // Standard meta keys that are allowed at the top level (in order for SEO)
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

  // Function to add a single meta tag
  const addMetaTag = (key, value) => {
    if (!value || INTERNAL_KEYS.has(key)) return

    const isProperty = key.startsWith('og:') || key.startsWith('twitter:')
    const attr = isProperty ? 'property' : 'name'

    if (Array.isArray(value)) {
      const content = value.join(', ')
      if (content) lines.push(`<meta ${attr}="${key}" content="${content}" />`)
    } else if (value) {
      const escapedValue = String(value).replace(/"/g, '&quot;')
      lines.push(`<meta ${attr}="${key}" content="${escapedValue}" />`)
    }
  }

  // Add ordered standard keys first
  orderedKeys.forEach((key) => {
    if (key in tags) addMetaTag(key, tags[key])
  })

  // Add any other top-level standard keys not in the ordered list
  // (must NOT be internal and must match known patterns: og:, twitter:, or simple name)
  Object.entries(tags).forEach(([key, value]) => {
    if (!orderedKeys.includes(key) && !INTERNAL_KEYS.has(key)) {
      // Only emit if it looks like a real meta key (og:, twitter:, or simple word)
      const isStandardPattern = /^[a-z][a-z0-9:_-]*$/.test(key)
      if (isStandardPattern) addMetaTag(key, value)
    }
  })

  // Process custom: { ... } — explicit user-defined meta tags
  if (tags.custom && typeof tags.custom === 'object') {
    Object.entries(tags.custom).forEach(([key, value]) => {
      addMetaTag(key, value)
    })
  }

  return lines.length > 0 ? '    ' + lines.join('\n    ') : ''
}

/**
 * Prerender a route to static HTML
 *
 * @param {Object} route - Route object
 * @param {string} template - HTML template
 * @param {Object} config - Configuration object
 * @param {string} renderedString - Processed HTML string from renderToString
 * @returns {Promise<string>} - Prerendered HTML
 */
const prerenderRoute = async (route, template, config, renderedString = '') => {
  const meta = route.meta || {}
  const defaultMeta = config.static.seo.meta || {}
  let html = template

  if (renderedString) {
    // Find the Ryunix root and inject the rendered HTML.
    // Improved regex to handle whitespace or existing content inside the div.
    html = html.replace(/(<div[^>]*id="__ryunix"[^>]*>)([\s\S]*?)(<\/div>)/i, `$1${renderedString}$3`);
  }

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
  let activeTemplate = template // may be mutated by manifest injection
  const prerenderRoutes = []

  // ─── app/manifest.js ───────────────────────────────────────────────────────
  const manifestFileCandidates = [
    path.join(process.cwd(), 'app', 'manifest.mjs'),
    path.join(process.cwd(), 'app', 'manifest.js'),
    path.join(process.cwd(), 'src', 'app', 'manifest.mjs'),
    path.join(process.cwd(), 'src', 'app', 'manifest.js'),
  ]
  const manifestFilePath = manifestFileCandidates.find((p) => fs.existsSync(p))

  if (manifestFilePath) {
    try {
      const mod = await importEsmFile(manifestFilePath)
      const manifestFn = mod.default
      if (typeof manifestFn !== 'function') {
        console.warn('[SSG] app/manifest.js must have a default function export. Skipping.')
      } else {
        const data = await manifestFn()
        if (data && typeof data === 'object') {
          const manifestJson = JSON.stringify(data, null, 2)
          fs.writeFileSync(path.join(buildDir, 'static', 'manifest.json'), manifestJson)
          console.log('[SSG] ✅ manifest.json created')

          // Inject <link rel="manifest"> into the template for all prerendered pages
          const manifestLink = '<link rel="manifest" href="/manifest.json" />'
          if (!activeTemplate.includes('rel="manifest"')) {
            activeTemplate = activeTemplate.replace('</head>', `${manifestLink}\n</head>`)
          }
        }
      }
    } catch (e) {
      console.error('[SSG] ❌ Error loading app/manifest.js:', e.message)
    }
  }

  let AppRouterApp = null;
  let ryunixRenderToString = null;
  let ryunixCreateElement = null;

  try {
    const serverBundlePath = path.join(buildDir, 'server', 'app-router-server.bundle.mjs');
    if (fs.existsSync(serverBundlePath)) {
      // Mock global browser APIs before importing the bundle in case of top-level references
      if (typeof global.window === 'undefined') {
        const noop = () => { }
        global.window = {
          location: { pathname: '/', search: '', hash: '', href: 'http://localhost/' },
          history: { pushState: noop, replaceState: noop, back: noop, forward: noop },
          addEventListener: noop,
          removeEventListener: noop,
          dispatchEvent: noop,
          scrollTo: noop,
          innerWidth: 1024,
          innerHeight: 768,
          navigator: { userAgent: 'ryunix-ssg' },
          localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
          sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop },
          requestAnimationFrame: (cb) => setTimeout(cb, 0),
          cancelAnimationFrame: (id) => clearTimeout(id),
          matchMedia: () => ({ matches: false, addListener: noop, removeListener: noop }),
        }
      }
      if (typeof global.document === 'undefined') {
        const noop = () => { }
        global.document = {
          querySelector: () => null,
          querySelectorAll: () => [],
          getElementById: () => null,
          getElementsByClassName: () => [],
          getElementsByTagName: () => [],
          createElement: (tag) => ({
            tagName: tag, style: {}, setAttribute: noop, appendChild: noop,
            addEventListener: noop, removeEventListener: noop
          }),
          createTextNode: () => ({ nodeType: 3 }),
          head: { querySelector: () => null, appendChild: noop },
          body: { appendChild: noop },
          title: '',
        }
      }
      if (typeof global.navigator === 'undefined') {
        global.navigator = { userAgent: 'ryunix-ssg' }
      }

      const serverModule = await import(`file://${serverBundlePath}?update=${Date.now()}`);
      AppRouterApp = serverModule.default?.default || serverModule.default;

      const ryunixCore = await import('@unsetsoft/ryunixjs');
      const Ryunix = ryunixCore.default || ryunixCore;
      global.Ryunix = Ryunix;
      ryunixRenderToString = Ryunix.renderToString;
      ryunixCreateElement = Ryunix.createElement;
    }
  } catch (e) {
    console.warn(`[SSG] ⚠️ Failed to load server bundle for true SSR. Falling back to simple template SSG: ${e.message}`);
  }

  // Prerender each route
  for (const route of routes) {
    try {
      let renderedString = ''

      if (AppRouterApp && ryunixRenderToString && ryunixCreateElement) {
        // Mock the window location for Ryunix router
        global.window = { location: { pathname: route.path } };
        console.log(`[SSG] Rendering ${route.path} with server App component...`)
        try {
          const element = ryunixCreateElement(AppRouterApp);

          if (typeof global.Ryunix?.renderToReadableStream === 'function') {
            const stream = global.Ryunix.renderToReadableStream(element);
            const reader = stream.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              renderedString += new TextDecoder().decode(value);
            }
          } else {
            renderedString = ryunixRenderToString(element);
          }
        } catch (err) {
          console.error(`[SSG] Error executing SSR render for ${route.path}:`, err)
        }
      } else {
        console.warn(`[SSG] Missing SSR dependencies for ${route.path}. AppRouterApp: ${!!AppRouterApp}, renderToString: ${!!ryunixRenderToString}, createElement: ${!!ryunixCreateElement}`)
      }

      const html = await prerenderRoute(route, activeTemplate, config, renderedString)
      console.log(`[SSG Debug] renderedString for ${route.path}:`, renderedString ? renderedString.substring(0, 100) + '...' : 'EMPTY');

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

  if (global.window) delete global.window; // Cleanup

  // Log results
  console.log(`✅ Prerendered ${prerenderRoutes.length} routes:`)
  prerenderRoutes.forEach((r) => console.log(` - ${r}`))

  // ─── Sitemap generation ──────────────────────────────────────────────────
  // Priority: app/sitemap.js (Next.js-style) > ryunix.config.js

  const sitemapFileCandidates = [
    path.join(process.cwd(), 'app', 'sitemap.mjs'),
    path.join(process.cwd(), 'app', 'sitemap.js'),
    path.join(process.cwd(), 'src', 'app', 'sitemap.mjs'),
    path.join(process.cwd(), 'src', 'app', 'sitemap.js'),
  ]
  const sitemapFilePath = sitemapFileCandidates.find((p) => fs.existsSync(p))

  if (sitemapFilePath) {
    // ── Next.js-style sitemap.js API ─────────────────────────────────────
    try {
      const mod = await importEsmFile(sitemapFilePath)
      const sitemapFn = mod.default
      const generateSitemaps = mod.generateSitemaps

      if (typeof sitemapFn !== 'function') {
        console.warn('[SSG] app/sitemap.js must have a default function export. Skipping.')
      } else {
        console.log(`[SSG] Using ${path.relative(process.cwd(), sitemapFilePath)}`)

        if (typeof generateSitemaps === 'function') {
          // ── Split sitemap mode ──────────────────────────────────────────
          const segments = await generateSitemaps()
          let baseURL = ''

          for (let i = 0; i < segments.length; i++) {
            const entries = await sitemapFn({ ...segments[i], id: i })
            if (!Array.isArray(entries) || entries.length === 0) continue

            if (!baseURL && entries[0]?.url) {
              try { baseURL = new URL(entries[0].url).origin } catch { }
            }

            const xml = generateSitemapFromEntries(entries)
            fs.writeFileSync(path.join(buildDir, 'static', `sitemap-${i}.xml`), xml)
            console.log(`✅ sitemap-${i}.xml (${entries.length} URLs)`)
          }

          if (baseURL && segments.length > 0) {
            const indexXml = generateSitemapIndex(baseURL, segments.length)
            fs.writeFileSync(path.join(buildDir, 'static', 'sitemap.xml'), indexXml)
            console.log(`✅ sitemap.xml (index of ${segments.length} sitemaps)`)
          }
        } else {
          // ── Single sitemap mode ─────────────────────────────────────────
          const entries = await sitemapFn({})
          if (Array.isArray(entries) && entries.length > 0) {
            const xml = generateSitemapFromEntries(entries)
            fs.writeFileSync(path.join(buildDir, 'static', 'sitemap.xml'), xml)
            console.log(`✅ Sitemap created (${entries.length} URLs)`)
          } else {
            console.warn('[SSG] sitemap() returned no entries.')
          }
        }
      }
    } catch (e) {
      console.error('[SSG] ❌ Error running app/sitemap.js:', e.message)
    }
  } else if (config.experimental?.ssg?.sitemap?.enable) {
  // ── Fallback: ryunix.config.js ───────────────────────────────────────
    try {
      const baseURL = config.experimental.ssg.sitemap.baseURL
      if (!baseURL) {
        console.warn('[SSG] ⚠️  baseURL not set — skipping sitemap.')
      } else {
        const xml = generateSitemap(routes, baseURL, config.experimental.ssg.sitemap.settings)
        fs.writeFileSync(path.join(buildDir, 'static', 'sitemap.xml'), xml)
        console.log('✅ Sitemap created')
      }
    } catch (error) {
      console.error('[SSG] ❌ Error generating Sitemap:', error)
    }
  }

  // ─── robots.txt generation ────────────────────────────────────────────────
  // Priority: app/robots.js > ryunix.config.js

  const robotsFileCandidates = [
    path.join(process.cwd(), 'app', 'robots.mjs'),
    path.join(process.cwd(), 'app', 'robots.js'),
    path.join(process.cwd(), 'src', 'app', 'robots.mjs'),
    path.join(process.cwd(), 'src', 'app', 'robots.js'),
  ]
  const robotsFilePath = robotsFileCandidates.find((p) => fs.existsSync(p))

  if (robotsFilePath) {
    try {
      const mod = await importEsmFile(robotsFilePath)
      const robotsFn = mod.default
      if (typeof robotsFn !== 'function') {
        console.warn('[SSG] app/robots.js must have a default function export. Skipping.')
      } else {
        console.log(`[SSG] Using ${path.relative(process.cwd(), robotsFilePath)}`)
        const data = await robotsFn()
        const robotsTxt = generateRobotsTxt(null, data)
        fs.writeFileSync(path.join(buildDir, 'static', 'robots.txt'), robotsTxt)
        console.log('✅ Robots.txt created')
      }
    } catch (e) {
      console.error('[SSG] ❌ Error running app/robots.js:', e.message)
    }
  } else if (config.experimental?.ssg?.robots || config.experimental?.ssg?.sitemap?.baseURL) {
    // ── Fallback: ryunix.config.js ───────────────────────────────────────
    const baseURL = config.experimental.ssg.sitemap?.baseURL
    if (baseURL) {
      try {
        const robotsTxt = generateRobotsTxt(baseURL, config.experimental?.ssg?.robots)
        fs.writeFileSync(path.join(buildDir, 'static', 'robots.txt'), robotsTxt)
        console.log('✅ Robots.txt created')
      } catch (error) {
        console.error('[SSG] ❌ Error generating Robots.txt:', error)
      }
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
  importEsmFile,
}
