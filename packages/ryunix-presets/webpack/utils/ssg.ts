/**
 * SSG Utilities - Static Site Generation
 * Provides utilities for generating static sites, sitemaps, and robots.txt
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import chalk from 'chalk'
import { randomBytes } from 'crypto'
import { resolvePageMetadata } from '@unsetsoft/ryunixjs'
import {
  buildMetadataPublicPath,
  copyRouteMetadataAssets,
  fromMetadataAssetManifest,
  metadataAssetsToMeta,
  type RouteMetadataAssetManifest,
} from './routeMetadataFiles.js'
import { moduleImportUrl } from './moduleImportUrl.js'

interface SsgRouteConfig {
  path?: string
  component?: unknown
  meta?: Record<string, unknown>
  metadataAssets?: RouteMetadataAssetManifest[]
  sitemap?: Record<string, unknown>
  label?: string
  NotFound?: unknown
  noRenderLink?: boolean
  subRoutes?: SsgRouteConfig[]
}

interface SsgResolvedRoute {
  path: string
  component?: unknown
  meta: Record<string, unknown>
  metadataAssets?: RouteMetadataAssetManifest[]
  sitemap: Record<string, unknown>
  label?: string
}

interface SitemapEntry {
  url?: string
  lastModified?: Date | string
  changefreq?: string
  priority?: number | string
}

type RyunixSsgConfig = Record<string, unknown>

type RyunixRuntimeGlobal = typeof globalThis & {
  Ryunix?: {
    renderToString?: (element: unknown) => string
    renderToStringAsync?: (element: unknown) => Promise<string>
    createElement?: (component: unknown) => unknown
    getState?: () => { ssrMetadata?: Record<string, unknown> }
  }
}

const ryunixGlobal = globalThis as RyunixRuntimeGlobal

/**
 * Import a file as ES module — works for both .mjs and .js files.
 * For .js files with ESM syntax, creates a temp .mjs copy to avoid the
 * NODE_TYPELESS_PACKAGE_JSON warning and performance overhead.
 * The temp file is cleaned up automatically after import.
 */
const importEsmFile = async (filePath: string) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
    return import(moduleImportUrl(filePath, true))
  }
  // For .js: copy to a temp .mjs so Node.js treats it as ESM without warnings
  const tmpPath = path.join(
    os.tmpdir(),
    `ryunix-ssg-${randomBytes(8).toString('hex')}.mjs`,
  )
  try {
    fs.copyFileSync(filePath, tmpPath)
    return await import(moduleImportUrl(tmpPath))
  } finally {
    try {
      fs.unlinkSync(tmpPath)
    } catch {}
  }
}

/**
 * Extract valid routes for SSG from routes configuration
 * Filters out dynamic routes and special routes
 *
 * @param {Array} routes - Array of route objects
 * @returns {Array} - Array of valid SSG routes
 */
const extractSSGRoutes = (routes: SsgRouteConfig[]): SsgResolvedRoute[] => {
  const ssgRoutes: SsgResolvedRoute[] = []

  const processRoute = (route: SsgRouteConfig, parentPath = '') => {
    // Skip invalid routes
    if (!route.path || route.path.includes(':')) return
    if (route.NotFound || route.noRenderLink) return

    const fullPath = parentPath + route.path
    const normalizedPath = fullPath === '' ? '/' : fullPath

    ssgRoutes.push({
      path: normalizedPath,
      component: route.component,
      meta: route.meta || {},
      metadataAssets: route.metadataAssets,
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
const generateRobotsTxt = (
  baseURL: string | null,
  options: Record<string, unknown> = {},
): string => {
  const lines: string[] = []

  if (Array.isArray(options.rules)) {
    // Next.js-style: rules array
    for (const rule of options.rules) {
      const agents = Array.isArray(rule.userAgent)
        ? rule.userAgent
        : [rule.userAgent || '*']
      agents.forEach((agent: string) => lines.push(`User-agent: ${agent}`))

      const allows = Array.isArray(rule.allow)
        ? rule.allow
        : rule.allow
          ? [rule.allow]
          : []
      const disallows = Array.isArray(rule.disallow)
        ? rule.disallow
        : rule.disallow
          ? [rule.disallow]
          : []
      allows.forEach((p: string) => lines.push(`Allow: ${p}`))
      disallows.forEach((p: string) => lines.push(`Disallow: ${p}`))
      lines.push('')
    }

    // Explicit sitemap URL overrides baseURL inference
    const sitemapUrl =
      options.sitemap || (baseURL ? `${baseURL}/sitemap.xml` : null)
    if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`)
  } else {
    // Legacy format
    const {
      disallow = [],
      allow = [],
      userAgents = ['*'],
    } = options as {
      disallow?: string[]
      allow?: string[]
      userAgents?: string[]
    }
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
const generateSitemap = (
  routes: SsgResolvedRoute[],
  baseURL: string,
  defaultSettings: Record<string, unknown> = {},
): string => {
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
const generateSitemapFromEntries = (entries: SitemapEntry[]): string => {
  const urls = entries
    .map((entry) => {
      if (!entry.url) return ''
      const lastmod = entry.lastModified
        ? entry.lastModified instanceof Date
          ? entry.lastModified.toISOString().split('T')[0]
          : String(entry.lastModified)
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
const generateSitemapIndex = (baseURL: string, count: number): string => {
  const sitemaps = Array.from(
    { length: count },
    (_, i) =>
      `  <sitemap>
    <loc>${baseURL}/sitemap-${i}.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`,
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`
}

const escapeHtml = (unsafe: unknown): string => {
  if (typeof unsafe !== 'string') return String(unsafe)
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
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
const generateMetaTags = (
  meta: Record<string, unknown>,
  defaultMeta: Record<string, unknown> = {},
): string => {
  const tags = { ...defaultMeta, ...meta }
  const lines: string[] = []

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
  const addMetaTag = (key: string, value: unknown) => {
    if (!value || INTERNAL_KEYS.has(key)) return

    const isProperty = key.startsWith('og:') || key.startsWith('twitter:')
    const attr = isProperty ? 'property' : 'name'
    const escapedKey = escapeHtml(key)

    if (Array.isArray(value)) {
      const content = value.join(', ')
      if (content)
        lines.push(
          `<meta ${attr}="${escapedKey}" content="${escapeHtml(content)}" />`,
        )
    } else if (value) {
      lines.push(
        `<meta ${attr}="${escapedKey}" content="${escapeHtml(value)}" />`,
      )
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

const injectSsrRootMarkup = (html: string, renderedString: string): string => {
  if (!renderedString) return html

  const marker = 'id="__ryunix"'
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) return html

  const openStart = html.lastIndexOf('<div', markerIndex)
  if (openStart === -1) return html

  const openEnd = html.indexOf('>', markerIndex)
  if (openEnd === -1) return html

  let depth = 1
  let pos = openEnd + 1
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf('<div', pos)
    const nextClose = html.indexOf('</div>', pos)
    if (nextClose === -1) break

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1
      pos = nextOpen + 4
      continue
    }

    depth -= 1
    if (depth === 0) {
      const openTag = html.slice(openStart, openEnd + 1)
      const markedOpenTag = openTag.includes('data-ryunix-ssr-root')
        ? openTag
        : openTag.replace(/^<div\b/i, '<div data-ryunix-ssr-root')
      return (
        html.slice(0, openStart) +
        markedOpenTag +
        renderedString +
        html.slice(nextClose)
      )
    }

    pos = nextClose + 6
  }

  return html
}

const buildMetadataLinkTags = (
  tags: Record<string, string | string[]>,
): string => {
  const lines: string[] = []

  const iconHref =
    (typeof tags.icon === 'string' && tags.icon) ||
    (typeof tags['shortcut icon'] === 'string' && tags['shortcut icon']) ||
    undefined
  if (iconHref) {
    lines.push(`<link rel="icon" href="${escapeHtml(iconHref)}" />`)
  }

  const appleIcon =
    typeof tags.appleTouchIcon === 'string' ? tags.appleTouchIcon : undefined
  if (appleIcon) {
    lines.push(
      `<link rel="apple-touch-icon" href="${escapeHtml(appleIcon)}" />`,
    )
  }

  const canonical =
    typeof tags.canonical === 'string' ? tags.canonical : undefined
  if (canonical) {
    lines.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`)
  }

  return lines.join('\n')
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
const prerenderRoute = async (
  route: { meta?: Record<string, unknown> },
  template: string,
  config: RyunixSsgConfig,
  renderedString = '',
): Promise<string> => {
  const meta = route.meta || {}
  const legacy = config.legacy as
    | {
        seo?: {
          meta?: Record<string, unknown>
          title?: { template?: string; prefix?: string }
        }
      }
    | undefined
  const defaultMeta = legacy?.seo?.meta || {}
  let html = template

  html = injectSsrRootMarkup(html, renderedString)

  const mergedMeta = { ...defaultMeta, ...meta }
  const resolved = resolvePageMetadata(mergedMeta, {
    title: legacy?.seo?.title,
  })
  const pageTitle = escapeHtml(resolved.title)
  html = html.replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`)

  const metaTags = generateMetaTags(resolved.tags, defaultMeta)
  const linkTags = buildMetadataLinkTags(resolved.tags)

  // Remove existing meta tags (except framework/mode) and duplicate favicon
  html = html.replace(/<meta\s+name="(?!framework|mode)[^"]*"[^>]*>/gi, '')
  html = html.replace(/<meta\s+property="[^"]*"[^>]*>/gi, '')
  html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, '')
  html = html.replace(/<link\s+rel="apple-touch-icon"[^>]*>/gi, '')

  // Remove duplicate favicon links (keep only first one)
  const faviconMatches = html.match(/<link\s+rel="icon"[^>]*>/gi)
  if (faviconMatches && faviconMatches.length > 1) {
    let firstFound = false
    html = html.replace(/<link\s+rel="icon"[^>]*>/gi, (match) => {
      if (!firstFound) {
        firstFound = true
        return match
      }
      return ''
    })
  }

  const headInjection = [metaTags, linkTags].filter(Boolean).join('\n')
  const viewportPosition = html.search(/<meta\s+name="viewport"/)
  const charsetPosition = html.search(/<meta\s+charset/)
  let insertPosition = -1

  if (viewportPosition !== -1) {
    const afterViewport = html.substring(viewportPosition)
    const tagEnd = afterViewport.search(/>/)
    insertPosition = viewportPosition + tagEnd + 1
  } else if (charsetPosition !== -1) {
    const afterCharset = html.substring(charsetPosition)
    const tagEnd = afterCharset.search(/>/)
    insertPosition = charsetPosition + tagEnd + 1
  }

  if (insertPosition !== -1 && headInjection) {
    const before = html.substring(0, insertPosition)
    const after = html.substring(insertPosition)
    html = before + '\n' + headInjection + after
  } else if (headInjection) {
    const frameworkPosition = html.search(/<meta\s+name="framework"/)
    if (frameworkPosition !== -1) {
      const before = html.substring(0, frameworkPosition)
      const after = html.substring(frameworkPosition)
      html = before + headInjection + '\n' + after
    } else {
      html = html.replace(/<\/head>/, `${headInjection}\n</head>`)
    }
  }

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
 * @param {boolean} debug - Debug mode
 */
const buildSSG = async (
  routesConfig: SsgRouteConfig[],
  config: RyunixSsgConfig,
  buildDir: string,
  debug = false,
): Promise<void> => {
  // Extract valid routes
  const routes = extractSSGRoutes(routesConfig)
  if (debug)
    console.log(`[SSG Debug] Starting buildSSG for ${routes.length} routes...`)

  if (routes.length === 0) {
    if (debug) console.log('[SSG Debug] No valid routes found to prerender.')
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
  const prerenderRoutes: string[] = []

  // ─── Static Metadata Files (Priority: .js > .xml/.txt/.json) ──────────────

  const legacyConfig = config.legacy as Record<string, unknown> | undefined
  const legacySsg = legacyConfig?.ssg as Record<string, unknown> | undefined
  const legacySitemap = legacySsg?.sitemap as
    | Record<string, unknown>
    | undefined
  const legacyRobots = legacySsg?.robots as Record<string, unknown> | undefined

  const appPath = path.join(
    process.cwd(),
    (config.rootDir as string | undefined) || 'src',
    'app',
  )
  const rootAppPath = path.join(process.cwd(), 'app')
  const finalAppPath = fs.existsSync(rootAppPath)
    ? rootAppPath
    : fs.existsSync(appPath)
      ? appPath
      : null

  const copyStaticIfExist = (src: string, dest: string): boolean => {
    if (!finalAppPath) return false
    const fullSrc = path.join(finalAppPath, src)
    if (fs.existsSync(fullSrc)) {
      fs.copyFileSync(fullSrc, path.join(buildDir, 'static', dest))
      if (debug) console.log(`[SSG] ✅ ${dest} copied from ${src}`)
      return true
    }
    return false
  }

  // ─── manifest.json ────────────────────────────────────────────────────────
  let hasManifest = false
  if (finalAppPath) {
    const manifestFileCandidates = [
      path.join(finalAppPath, 'manifest.js'),
      path.join(finalAppPath, 'manifest.js'),
    ]
    const manifestFilePath = manifestFileCandidates.find((p) =>
      fs.existsSync(p),
    )

    if (manifestFilePath) {
      try {
        const mod = await importEsmFile(manifestFilePath)
        const manifestFn = mod.default
        if (typeof manifestFn === 'function') {
          const data = await manifestFn()
          if (data && typeof data === 'object') {
            fs.writeFileSync(
              path.join(buildDir, 'static', 'manifest.json'),
              JSON.stringify(data, null, 2),
            )
            if (debug) console.log('[SSG] ✅ manifest.json created from .js')
            hasManifest = true
          }
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        console.error('[SSG] ❌ Error loading manifest.js:', message)
      }
    } else {
      hasManifest = copyStaticIfExist('manifest.json', 'manifest.json')
    }
  }

  if (hasManifest) {
    const manifestLink = '<link rel="manifest" href="/manifest.json" />'
    if (!activeTemplate.includes('rel="manifest"')) {
      activeTemplate = activeTemplate.replace(
        '</head>',
        `${manifestLink}\n</head>`,
      )
    }
  }

  let AppRouterApp: unknown = null
  let ryunixRenderToString: ((element: unknown) => string) | null = null
  let ryunixCreateElement: ((component: unknown) => unknown) | null = null

  try {
    const serverBundleCandidates = [
      path.join(buildDir, 'server', 'app-router-server.bundle.js'),
      path.join(buildDir, 'server', 'app-router-server.bundle.mjs'),
    ]
    const serverBundlePath = serverBundleCandidates.find((p) =>
      fs.existsSync(p),
    )
    if (serverBundlePath) {
      // Mock global browser APIs before importing the bundle in case of top-level references
      if (
        typeof (globalThis as Record<string, unknown>).window === 'undefined'
      ) {
        const noop = () => {}
        ;(globalThis as Record<string, unknown>).window = {
          location: {
            pathname: '/',
            search: '',
            hash: '',
            href: 'http://localhost/',
          },
          history: {
            pushState: noop,
            replaceState: noop,
            back: noop,
            forward: noop,
          },
          addEventListener: noop,
          removeEventListener: noop,
          dispatchEvent: noop,
          scrollTo: noop,
          innerWidth: 1024,
          innerHeight: 768,
          navigator: { userAgent: 'ryunix-ssg' },
          localStorage: {
            getItem: () => null,
            setItem: noop,
            removeItem: noop,
          },
          sessionStorage: {
            getItem: () => null,
            setItem: noop,
            removeItem: noop,
          },
          requestAnimationFrame: (cb: () => void) => setTimeout(cb, 0),
          cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) =>
            clearTimeout(id),
          matchMedia: () => ({
            matches: false,
            addListener: noop,
            removeListener: noop,
          }),
        }
      }
      if (
        typeof (globalThis as Record<string, unknown>).document === 'undefined'
      ) {
        const noop = () => {}
        ;(globalThis as Record<string, unknown>).document = {
          querySelector: () => null,
          querySelectorAll: () => [],
          getElementById: () => null,
          getElementsByClassName: () => [],
          getElementsByTagName: () => [],
          createElement: (tag: string) => ({
            tagName: tag,
            style: {},
            setAttribute: noop,
            appendChild: noop,
            addEventListener: noop,
            removeEventListener: noop,
          }),
          createTextNode: () => ({ nodeType: 3 }),
          head: { querySelector: () => null, appendChild: noop },
          body: { appendChild: noop },
          title: '',
        }
      }
      if (
        typeof (globalThis as Record<string, unknown>).navigator === 'undefined'
      ) {
        ;(globalThis as Record<string, unknown>).navigator = {
          userAgent: 'ryunix-ssg',
        }
      }

      const serverModule = await import(moduleImportUrl(serverBundlePath, true))
      AppRouterApp = serverModule.default?.default || serverModule.default

      const ryunixCore = await import('@unsetsoft/ryunixjs')
      const Ryunix = ryunixCore.default || ryunixCore
      // User .ryx modules reference the Ryunix JSX pragma without importing it.
      // Match ssrDevHandler: expose the full runtime, not a partial API stub.
      ryunixGlobal.Ryunix = Ryunix as RyunixRuntimeGlobal['Ryunix']
      ryunixRenderToString = Ryunix.renderToString as (
        element: unknown,
      ) => string
      ryunixCreateElement = Ryunix.createElement as (
        component: unknown,
      ) => unknown
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    console.warn(
      `[SSG] ⚠️ Failed to load server bundle for true SSR. Falling back to simple template SSG: ${message}`,
    )
  }

  // Prerender each route
  const ssrFailures: { path: string; error: unknown }[] = []

  for (const route of routes) {
    try {
      let renderedString = ''

      if (AppRouterApp && ryunixRenderToString && ryunixCreateElement) {
        // Mock the window location for Ryunix router
        ;(globalThis as Record<string, unknown>).window = {
          location: { pathname: route.path },
        }
        if (debug)
          console.log(
            `[SSG] Rendering ${route.path} with server App component...`,
          )
        try {
          const element = ryunixCreateElement(AppRouterApp)

          if (typeof ryunixGlobal.Ryunix?.renderToStringAsync === 'function') {
            renderedString =
              await ryunixGlobal.Ryunix.renderToStringAsync(element)
          } else {
            renderedString = ryunixRenderToString(element)
          }
        } catch (err) {
          console.error(
            `[SSG] Error executing SSR render for ${route.path}:`,
            err,
          )
          ssrFailures.push({ path: route.path, error: err })
        }
      } else if (AppRouterApp) {
        const missing = new Error(
          `Missing SSR APIs (renderToString: ${!!ryunixRenderToString}, createElement: ${!!ryunixCreateElement})`,
        )
        console.error(`[SSG] ${missing.message} for ${route.path}`)
        ssrFailures.push({ path: route.path, error: missing })
      } else {
        console.warn(
          `[SSG] Missing SSR dependencies for ${route.path}. AppRouterApp: ${!!AppRouterApp}, renderToString: ${!!ryunixRenderToString}, createElement: ${!!ryunixCreateElement}`,
        )
      }

      const ssrMetadata = ryunixGlobal.Ryunix?.getState?.()?.ssrMetadata || {}
      const sitemapBaseURL =
        typeof legacySitemap?.baseURL === 'string' ? legacySitemap.baseURL : ''
      const resolvedMetadataAssets = route.metadataAssets?.length
        ? fromMetadataAssetManifest(
            route.metadataAssets.map((asset) => ({
              ...asset,
              publicPath: buildMetadataPublicPath(route.path, asset.filename),
            })),
          )
        : []
      const fileMetaFromAssets = resolvedMetadataAssets.length
        ? metadataAssetsToMeta(resolvedMetadataAssets, sitemapBaseURL)
        : {}

      if (resolvedMetadataAssets.length > 0) {
        copyRouteMetadataAssets(
          resolvedMetadataAssets,
          path.join(buildDir, 'static'),
        )
      }

      const html = await prerenderRoute(
        {
          ...route,
          meta: { ...fileMetaFromAssets, ...route.meta, ...ssrMetadata },
        },
        activeTemplate,
        config,
        renderedString,
      )
      if (debug)
        console.log(
          `[SSG Debug] renderedString for ${route.path}:`,
          renderedString ? renderedString.substring(0, 100) + '...' : 'EMPTY',
        )

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
      ssrFailures.push({ path: route.path, error })
    }
  }

  if (ssrFailures.length > 0) {
    const summary = ssrFailures
      .map(({ path, error }) => {
        const msg = error instanceof Error ? error.message : String(error)
        return `  - ${path}: ${msg}`
      })
      .join('\n')
    throw new Error(
      `[SSG] Failed to prerender ${ssrFailures.length} route(s):\n${summary}`,
    )
  }

  ;(globalThis as Record<string, unknown>).window = undefined // Cleanup

  // Log results
  console.log(
    `\n${chalk.cyan('○')}  Prerendered ${chalk.bold(prerenderRoutes.length)} routes:`,
  )
  prerenderRoutes.forEach((r) =>
    console.log(`   ${chalk.green('✔')} ${chalk.gray(r)}`),
  )
  console.log('')

  // ─── Sitemap generation ──────────────────────────────────────────────────
  // Priority: app/sitemap.js (Next.js-style) > ryunix.config.js

  const sitemapFileCandidates = finalAppPath
    ? [
        path.join(finalAppPath, 'sitemap.mjs'),
        path.join(finalAppPath, 'sitemap.js'),
      ]
    : []
  const sitemapFilePath = sitemapFileCandidates.find((p) => fs.existsSync(p))

  if (sitemapFilePath) {
    // ── Next.js-style sitemap.js API ─────────────────────────────────────
    try {
      const mod = await importEsmFile(sitemapFilePath)
      const sitemapFn = mod.default
      const generateSitemaps = mod.generateSitemaps

      if (typeof sitemapFn !== 'function') {
        console.warn(
          '[SSG] app/sitemap.js must have a default function export. Skipping.',
        )
      } else {
        if (debug)
          console.log(
            `[SSG] Using ${path.relative(process.cwd(), sitemapFilePath)}`,
          )

        if (typeof generateSitemaps === 'function') {
          // ── Split sitemap mode ──────────────────────────────────────────
          const segments = await generateSitemaps()
          let baseURL = ''

          for (let i = 0; i < segments.length; i++) {
            const entries = await sitemapFn({ ...segments[i], id: i })
            if (!Array.isArray(entries) || entries.length === 0) continue

            if (!baseURL && entries[0]?.url) {
              try {
                baseURL = new URL(entries[0].url).origin
              } catch {}
            }

            const xml = generateSitemapFromEntries(entries)
            fs.writeFileSync(
              path.join(buildDir, 'static', `sitemap-${i}.xml`),
              xml,
            )
            if (debug)
              console.log(`✅ sitemap-${i}.xml (${entries.length} URLs)`)
          }

          if (baseURL && segments.length > 0) {
            const indexXml = generateSitemapIndex(baseURL, segments.length)
            fs.writeFileSync(
              path.join(buildDir, 'static', 'sitemap.xml'),
              indexXml,
            )
            if (debug)
              console.log(
                `${chalk.green('✔')} Sitemap:  ${chalk.bold('Generated Index')} (${segments.length} sitemaps)`,
              )
          }
        } else {
          // ── Single sitemap mode ─────────────────────────────────────────
          const entries = await sitemapFn({})
          if (Array.isArray(entries) && entries.length > 0) {
            const xml = generateSitemapFromEntries(entries)
            fs.writeFileSync(path.join(buildDir, 'static', 'sitemap.xml'), xml)
            if (debug)
              console.log(
                `${chalk.green('✔')} Sitemap:  ${chalk.bold('Generated')} (${entries.length} URLs)`,
              )
          } else {
            console.warn('[SSG] sitemap() returned no entries.')
          }
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[SSG] ❌ Error running app/sitemap.js:', message)
    }
  } else if (copyStaticIfExist('sitemap.xml', 'sitemap.xml')) {
    // Already copied
  } else if (legacySitemap?.enable) {
    // ── Fallback: ryunix.config.js ───────────────────────────────────────
    try {
      const baseURL = legacySitemap.baseURL
      if (!baseURL) {
        console.warn('[SSG] ⚠️  baseURL not set — skipping sitemap.')
      } else {
        const xml = generateSitemap(
          routes,
          String(baseURL),
          (legacySitemap.settings as Record<string, unknown>) || {},
        )
        fs.writeFileSync(path.join(buildDir, 'static', 'sitemap.xml'), xml)
        if (debug)
          console.log(
            `${chalk.green('✔')} Sitemap:  ${chalk.bold('Generated (Legacy)')}`,
          )
      }
    } catch (error) {
      console.error('[SSG] ❌ Error generating Sitemap:', error)
    }
  }

  // ─── robots.txt generation ────────────────────────────────────────────────
  // Priority: app/robots.js > ryunix.config.js

  const robotsFileCandidates = finalAppPath
    ? [
        path.join(finalAppPath, 'robots.mjs'),
        path.join(finalAppPath, 'robots.js'),
      ]
    : []
  const robotsFilePath = robotsFileCandidates.find((p) => fs.existsSync(p))

  if (robotsFilePath) {
    try {
      const mod = await importEsmFile(robotsFilePath)
      const robotsFn = mod.default
      if (typeof robotsFn !== 'function') {
        console.warn(
          '[SSG] app/robots.js must have a default function export. Skipping.',
        )
      } else {
        if (debug)
          console.log(
            `[SSG] Using ${path.relative(process.cwd(), robotsFilePath)}`,
          )
        const data = await robotsFn()
        const robotsTxt = generateRobotsTxt(null, data)
        fs.writeFileSync(path.join(buildDir, 'static', 'robots.txt'), robotsTxt)
        if (debug)
          console.log(
            `${chalk.green('✔')} Robots:   ${chalk.bold('Generated')}`,
          )
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[SSG] ❌ Error running app/robots.js:', message)
    }
  } else if (copyStaticIfExist('robots.txt', 'robots.txt')) {
    // Already copied
  } else if (legacyRobots || legacySitemap?.baseURL) {
    // ── Fallback: ryunix.config.js ───────────────────────────────────────
    const baseURL = legacySitemap?.baseURL
    if (baseURL) {
      try {
        const robotsTxt = generateRobotsTxt(String(baseURL), legacyRobots)
        fs.writeFileSync(path.join(buildDir, 'static', 'robots.txt'), robotsTxt)
        if (debug)
          console.log(
            `${chalk.green('✔')} Robots:   ${chalk.bold('Generated (Legacy)')}`,
          )
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
